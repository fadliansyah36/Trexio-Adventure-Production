"""
Trexio backend — verification of HIGH security fixes (H-1 rate limit, H-2 secure cookie,
H-5 centralized/generic error handling) + booking checkout server-side pricing.

IMPORTANT ORDER: rate-limit test (H-1) is last (class TestZZZRateLimit) because it locks
the IP for auth endpoints for 15 minutes.
"""
import os
import re
import json

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

TRAVELER = {"email": "traveler@trexio.id", "password": "traveler123"}

LEAK_PATTERNS = [
    "undefined is not", "Cannot read", "at Object", "/app/", "TypeError",
    "ReferenceError", "at Function", "node_modules", "SyntaxError",
    "at async", "handleBooking", "\n    at ",
]


def assert_no_leak(payload_text, ctx=""):
    for pat in LEAK_PATTERNS:
        assert pat.lower() not in payload_text.lower(), f"Internal detail leaked ({pat}) in {ctx}: {payload_text[:400]}"


@pytest.fixture(scope="session")
def login_response():
    r = requests.post(f"{BASE_URL}/api/auth/login", json=TRAVELER, timeout=30)
    return r


@pytest.fixture(scope="session")
def traveler_token(login_response):
    if login_response.status_code != 200:
        pytest.fail(f"Traveler login failed: {login_response.status_code} {login_response.text[:300]}")
    data = login_response.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.fail(f"No token in login response: {json.dumps(data)[:300]}")
    return token


@pytest.fixture
def auth_headers(traveler_token):
    return {"Authorization": f"Bearer {traveler_token}", "Content-Type": "application/json"}


# ---------------- REGRESSION CRITICAL ----------------
class TestARegressionCritical:
    def test_traveler_login_ok(self, login_response, traveler_token):
        assert login_response.status_code == 200
        assert isinstance(traveler_token, str) and len(traveler_token) > 20
        data = login_response.json()
        user = data.get("user") or {}
        assert user.get("email") == TRAVELER["email"]

    def test_backdoor_password_rejected(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "superadmin@trexio.id", "password": "admin123"}, timeout=30)
        assert r.status_code == 401, f"Backdoor open! {r.status_code} {r.text[:300]}"
        body = r.text
        assert "access_token" not in body and "requires_2fa" not in body

    def test_midtrans_notification_without_signature(self):
        r = requests.post(f"{BASE_URL}/api/payments/midtrans/notification",
                          json={"order_id": "TRX-TEST-HIGH", "transaction_status": "settlement",
                                "gross_amount": "1700000.00", "status_code": "200"}, timeout=30)
        assert r.status_code in (403, 503), f"Expected 403/503, got {r.status_code}: {r.text[:300]}"
        assert_no_leak(r.text, "midtrans notification")

    def test_ai_chat_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/ai/assistant/chat", json={"message": "halo"}, timeout=30)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text[:300]}"
        assert_no_leak(r.text, "ai chat unauth")


# ---------------- H-2 secure cookie ----------------
class TestBCookieFlags:
    def test_access_token_cookie_flags(self, login_response):
        assert login_response.status_code == 200
        raw_cookies = login_response.raw.headers.getlist("Set-Cookie") if hasattr(login_response.raw, "headers") else []
        target = [c for c in raw_cookies if c.strip().lower().startswith("access_token=")]
        assert target, f"No access_token Set-Cookie header. Headers: {raw_cookies}"
        cookie = target[0]
        assert "httponly" in cookie.lower(), f"HttpOnly missing: {cookie}"
        # NOTE: the app sets sameSite:'lax' (server.js res.cookie), but the Emergent preview
        # ingress rewrites cookies for cross-site iframe use to "SameSite=None; Secure; Partitioned".
        # Accept either Lax (direct) or None+Secure (proxy-rewritten); reject a missing SameSite.
        samesite = re.search(r"samesite=(\w+)", cookie, re.I)
        assert samesite, f"SameSite attribute missing: {cookie}"
        value = samesite.group(1).lower()
        assert value in ("lax", "none"), f"Unexpected SameSite={value}: {cookie}"
        if value == "none":
            assert "secure" in cookie.lower(), f"SameSite=None without Secure: {cookie}"
        src = open("/app/server.js", encoding="utf-8").read()
        assert "res.cookie('access_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax'" in src


# ---------------- H-5 generic error handling ----------------
class TestCErrorHandling:
    def test_booking_invalid_trip_returns_generic_404(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "trip_id": "trip_does_not_exist_zzz", "departure_date": "2026-03-14", "quantity": 1,
            "contact_name": "Demo", "contact_phone": "08123", "payment_method": "midtrans"
        }, timeout=30)
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text[:400]}"
        assert_no_leak(r.text, "booking invalid trip")
        body = r.json()
        msg = str(body.get("detail") or body.get("message") or body)
        assert len(msg) > 5

    def test_malformed_json_no_leak(self, traveler_token):
        r = requests.post(f"{BASE_URL}/api/ai/assistant/chat",
                          headers={"Authorization": f"Bearer {traveler_token}",
                                   "Content-Type": "application/json"},
                          data='{"message": "halo"', timeout=60)
        assert r.status_code in (400, 401, 422, 500), f"Unexpected {r.status_code}: {r.text[:300]}"
        assert_no_leak(r.text, "malformed json ai")

    def test_weird_body_types_no_leak(self, auth_headers):
        for body in ({"message": {"a": [1, 2]}}, {"message": None}, {"message": 12345}, {}):
            r = requests.post(f"{BASE_URL}/api/ai/assistant/chat", headers=auth_headers, json=body, timeout=90)
            assert_no_leak(r.text, f"ai body {body}")
            assert r.status_code != 502

    def test_booking_weird_body_no_leak(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "trip_id": {"nested": True}, "quantity": "abc", "participants": "not-a-list",
            "payment_method": ["midtrans"]
        }, timeout=30)
        assert r.status_code in (400, 404, 422, 500), f"Unexpected {r.status_code}: {r.text[:400]}"
        assert_no_leak(r.text, "booking weird body")


# ---------------- Booking checkout ----------------
class TestDBookingCheckout:
    def test_booking_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/bookings", json={
            "trip_id": "trip_01", "departure_date": "2026-03-14", "quantity": 2,
            "contact_name": "Demo", "contact_phone": "08123", "payment_method": "midtrans"
        }, timeout=30)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text[:300]}"

    def test_server_side_pricing(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "trip_id": "trip_01", "departure_date": "2026-03-14", "quantity": 2,
            "contact_name": "Demo", "contact_phone": "08123", "payment_method": "midtrans"
        }, timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:400]}"
        b = r.json()
        assert b.get("total_amount") == 1700000, f"total_amount={b.get('total_amount')}"
        assert b.get("subtotal") == 1700000, f"subtotal={b.get('subtotal')}"
        assert b.get("booking_status") == "pending_payment", f"status={b.get('booking_status')}"
        assert str(b.get("booking_code", "")).startswith("TRX-"), f"code={b.get('booking_code')}"
        assert "_id" not in b

    def test_client_price_tampering_ignored(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "trip_id": "trip_01", "departure_date": "2026-03-14", "quantity": 2,
            "total_amount": 1000, "subtotal": 1000, "price": 1,
            "contact_name": "Demo", "contact_phone": "08123", "payment_method": "midtrans"
        }, timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:400]}"
        b = r.json()
        assert b.get("total_amount") == 1700000, f"Client price trusted! total_amount={b.get('total_amount')}"

    def test_coupon_discount_server_side(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "trip_id": "trip_01", "quantity": 1, "coupon_code": "TREXIO10",
            "payment_method": "midtrans"
        }, timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text[:400]}"
        b = r.json()
        assert b.get("total_amount") == 765000, f"total_amount={b.get('total_amount')} (expected 765000)"

    def test_booking_persisted(self, auth_headers):
        create = requests.post(f"{BASE_URL}/api/bookings", headers=auth_headers, json={
            "trip_id": "trip_01", "departure_date": "2026-03-20", "quantity": 1,
            "contact_name": "TEST_Persist", "contact_phone": "08123", "payment_method": "midtrans"
        }, timeout=30)
        assert create.status_code == 200, create.text[:300]
        bid = create.json().get("id")
        assert bid
        g = requests.get(f"{BASE_URL}/api/bookings/{bid}", headers=auth_headers, timeout=30)
        assert g.status_code == 200, f"GET booking {g.status_code}: {g.text[:300]}"
        got = g.json()
        assert got.get("total_amount") == 850000
        assert got.get("id") == bid
        assert "_id" not in got


# ---------------- H-1 rate limiting (LAST) ----------------
class TestZZZRateLimit:
    def test_auth_brute_force_rate_limited(self):
        statuses = []
        for _ in range(18):
            r = requests.post(f"{BASE_URL}/api/auth/login",
                              json={"email": "bruteforce@x.com", "password": "salah"}, timeout=30)
            statuses.append(r.status_code)
            if r.status_code == 429:
                assert_no_leak(r.text, "rate limit response")
        print(f"Login attempt statuses: {statuses}")
        assert 429 in statuses, f"No 429 seen after 18 failed logins: {statuses}"
        first_429 = statuses.index(429)
        assert all(s in (401, 400, 429) for s in statuses), statuses
        assert first_429 >= 10, f"Rate limit triggered too early at attempt {first_429 + 1}: {statuses}"

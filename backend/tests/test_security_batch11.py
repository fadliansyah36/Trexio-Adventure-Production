"""Trexio security batch (iteration 11): strict CSP+nonce, login hardening,
register field validation, hardcoded-credential removal, checkout/webhook security.

NOTE: authLimiter = max 15 FAILED auth attempts / 15 min / IP (login + register).
Failed attempts are kept minimal and the rate-limit test runs LAST (file order).
"""
import os
import re
import uuid

import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

TRAVELER = {"email": "traveler@trexio.id", "password": "traveler123"}
ADMIN_STRONG = {"email": "admin@trexio.id", "password": "Trexio!Admin#2026Secure"}

S = requests.Session()
S.headers.update({"Content-Type": "application/json"})


def login(email, password):
    return S.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)


# ---------------- CSP (M-1) ----------------
class TestCSP:
    def test_csp_header_strict_and_nonce_per_request(self):
        r1 = S.get(f"{API}/trips", timeout=30)
        r2 = S.get(f"{API}/trips", timeout=30)
        assert r1.status_code == 200, r1.text[:300]
        csp1 = r1.headers.get("Content-Security-Policy")
        csp2 = r2.headers.get("Content-Security-Policy")
        assert csp1 and csp2, "CSP header missing"

        script_src = next(d.strip() for d in csp1.split(";") if d.strip().startswith("script-src"))
        assert "'self'" in script_src
        assert "'strict-dynamic'" in script_src
        m1 = re.search(r"'nonce-([A-Za-z0-9+/=]+)'", script_src)
        assert m1, f"no nonce in script-src: {script_src}"
        assert "'unsafe-inline'" not in script_src, script_src
        assert "'unsafe-eval'" not in script_src, script_src
        assert "'unsafe-eval'" not in csp1, csp1

        for directive in ["object-src 'none'", "frame-ancestors 'self'", "base-uri 'self'"]:
            assert directive in csp1, f"missing {directive}"

        m2 = re.search(r"'nonce-([A-Za-z0-9+/=]+)'", csp2)
        assert m2 and m1.group(1) != m2.group(1), "nonce is not per-request"

    def test_extra_security_headers(self):
        h = S.get(f"{API}/trips", timeout=30).headers
        assert h.get("X-Content-Type-Options") == "nosniff"
        assert "Permissions-Policy" in h
        assert h.get("Cross-Origin-Opener-Policy") == "same-origin"
        assert "max-age" in (h.get("Strict-Transport-Security") or "")


# ---------------- Login hardening / backdoor removal (3 failed attempts) ----------------
class TestLoginHardening:
    def test_traveler_login_success(self):
        r = login(**TRAVELER)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        token = data.get("token") or data.get("access_token")
        assert isinstance(token, str) and len(token) > 10
        assert data.get("user", {}).get("email") == TRAVELER["email"]

    def test_superadmin_weak_admin123_rejected(self):
        r = login("superadmin@trexio.id", "admin123")
        assert r.status_code == 401, f"{r.status_code} {r.text[:300]}"

    def test_superadmin_weak_trexio123_rejected(self):
        r = login("superadmin@trexio.id", "trexio123")
        assert r.status_code == 401, f"{r.status_code} {r.text[:300]}"

    def test_prod_admin_weak_admin123_rejected(self):
        r = login("trexioadventure@gmail.com", "admin123")
        assert r.status_code == 401, f"{r.status_code} {r.text[:300]}"

    def test_admin_strong_password_requires_2fa(self):
        r = login(**ADMIN_STRONG)
        assert r.status_code != 401, f"unexpected 401: {r.text[:300]}"
        assert r.status_code == 200, r.text[:300]
        assert r.json().get("requires_2fa") is True, r.text[:300]


# ---------------- Register validation (2 failed attempts) ----------------
class TestRegisterValidation:
    fresh_email = f"freshuser_{uuid.uuid4().hex[:8]}@test.com"

    def test_password_too_short(self):
        r = S.post(f"{API}/auth/register",
                   json={"name": "A", "email": "newuser1@test.com", "password": "short"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"
        assert "Kata sandi minimal 8 karakter." in r.text, r.text[:300]

    def test_invalid_email(self):
        r = S.post(f"{API}/auth/register",
                   json={"name": "A", "email": "bukan-email", "password": "ValidPass123"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"
        assert "Format email tidak valid." in r.text, r.text[:300]

    def test_valid_registration(self):
        r = S.post(f"{API}/auth/register", json={
            "name": "User Baru", "email": self.fresh_email,
            "password": "ValidPass123", "confirmPassword": "ValidPass123"}, timeout=30)
        assert r.status_code in (200, 201), f"{r.status_code} {r.text[:300]}"
        data = r.json()
        user = data.get("user") or data
        assert user.get("email") == self.fresh_email, r.text[:300]
        assert "password_hash" not in str(data), "password hash leaked in response"

    def test_duplicate_email(self):
        r = S.post(f"{API}/auth/register", json={
            "name": "User Baru", "email": self.fresh_email,
            "password": "ValidPass123", "confirmPassword": "ValidPass123"}, timeout=30)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"
        assert "Email sudah terdaftar" in r.text, r.text[:300]


# ---------------- Checkout / booking server-side pricing ----------------
class TestCheckoutSecurity:
    def _token(self):
        r = login(**TRAVELER)
        assert r.status_code == 200, r.text[:300]
        return r.json().get("token") or r.json().get("access_token")

    def test_booking_requires_auth(self):
        r = requests.post(f"{API}/bookings", json={
            "trip_id": "trip_01", "departure_date": "2026-03-21", "quantity": 2,
            "contact_name": "Demo", "contact_phone": "08123", "payment_method": "midtrans"}, timeout=30)
        assert r.status_code == 401, f"{r.status_code} {r.text[:300]}"

    def test_booking_ignores_client_total_amount(self):
        token = self._token()
        r = requests.post(f"{API}/bookings", headers={"Authorization": f"Bearer {token}"}, json={
            "trip_id": "trip_01", "departure_date": "2026-03-21", "quantity": 2,
            "contact_name": "Demo", "contact_phone": "08123",
            "payment_method": "midtrans", "total_amount": 5}, timeout=60)
        assert r.status_code == 200, f"{r.status_code} {r.text[:400]}"
        data = r.json()
        booking = data.get("booking") or data
        assert booking.get("total_amount") == 1700000, f"expected 1700000 got {booking.get('total_amount')}"

    def test_booking_invalid_trip_generic_error(self):
        token = self._token()
        r = requests.post(f"{API}/bookings", headers={"Authorization": f"Bearer {token}"}, json={
            "trip_id": "tidak_ada", "departure_date": "2026-03-21", "quantity": 1,
            "contact_name": "Demo", "contact_phone": "08123", "payment_method": "midtrans"}, timeout=30)
        assert r.status_code == 404, f"{r.status_code} {r.text[:300]}"
        body = r.text
        for leak in ["/app/", "Traceback", "at Object.", "err.message", "node_modules"]:
            assert leak not in body, f"leak '{leak}' in error body: {body[:400]}"


# ---------------- Midtrans webhook ----------------
class TestWebhookSecurity:
    def test_notification_without_signature_rejected(self):
        r = S.post(f"{API}/payments/midtrans/notification", json={
            "order_id": "X", "transaction_status": "settlement",
            "status_code": "200", "gross_amount": "1"}, timeout=30)
        assert r.status_code in (403, 503), f"{r.status_code} {r.text[:300]}"


# ---------------- H-1 rate limit (MUST RUN LAST: locks IP for 15 min) ----------------
class TestZZRateLimit:
    def test_login_brute_force_rate_limited(self):
        statuses = []
        for _ in range(18):
            r = S.post(f"{API}/auth/login",
                       json={"email": "bruteXYZ@x.com", "password": "salah"}, timeout=30)
            statuses.append(r.status_code)
            if r.status_code == 429:
                break
        assert 429 in statuses, f"no 429 seen: {statuses}"
        assert statuses[0] == 401, f"first attempt should be 401: {statuses}"

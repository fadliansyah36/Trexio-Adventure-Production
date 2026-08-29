"""Trexio security fix verification (C-1..C-6) — backend only."""
import os
import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")

SUPER_ADMINS = ["superadmin@trexio.id", "admin@trexio.id"]
BACKDOORS = ["admin123", "trexio123", "SuperAdmin2026!", "superadmin123"]
SEED_ADMIN_PASSWORD = "Trexio!Admin#2026Secure"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def login(client, email, password):
    return client.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=30)


@pytest.fixture(scope="session")
def traveler_token(client):
    r = login(client, "traveler@trexio.id", "traveler123")
    if r.status_code != 200:
        pytest.fail(f"Traveler login failed {r.status_code}: {r.text[:300]}")
    data = r.json()
    token = data.get("access_token") or data.get("token") or (data.get("data") or {}).get("access_token") or (data.get("data") or {}).get("token")
    if not token:
        pytest.fail(f"No token in login response: {r.text[:300]}")
    return token


# --- C-1: backdoor removed ---
@pytest.mark.parametrize("email", SUPER_ADMINS)
@pytest.mark.parametrize("password", BACKDOORS)
def test_c1_backdoor_rejected(client, email, password):
    r = login(client, email, password)
    body = r.text[:300]
    assert r.status_code == 401, f"{email}/{password} => {r.status_code}: {body}"
    if r.headers.get("content-type", "").startswith("application/json"):
        data = r.json()
        assert not data.get("requires_2fa"), f"requires_2fa leaked for backdoor: {body}"
        assert not (data.get("access_token") or data.get("token")), f"token issued for backdoor: {body}"


# --- C-5: env seeded admin password valid ---
def test_c5_seed_admin_password_accepted(client):
    r = login(client, "admin@trexio.id", SEED_ADMIN_PASSWORD)
    assert r.status_code != 401, f"seed admin password rejected: {r.text[:300]}"
    assert r.status_code == 200, f"unexpected status {r.status_code}: {r.text[:300]}"
    data = r.json()
    assert data.get("requires_2fa") is True, f"expected requires_2fa: {str(data)[:300]}"
    assert data.get("temp_token") or (data.get("data") or {}).get("temp_token"), f"missing temp_token: {str(data)[:300]}"


# --- Regression: normal user login ---
def test_login_traveler(traveler_token):
    assert isinstance(traveler_token, str) and traveler_token.count(".") == 2


# --- C-4: JWT valid ---
def test_c4_auth_me(client, traveler_token):
    r = client.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {traveler_token}"}, timeout=30)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    data = r.json()
    blob = str(data)
    assert "traveler@trexio.id" in blob, f"user data missing: {blob[:300]}"


def test_c4_auth_me_invalid_token():
    # fresh request (no session cookies) so only the bearer token is evaluated
    r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"}, timeout=30)
    assert r.status_code in (401, 403), f"{r.status_code}: {r.text[:300]}"


# --- C-3: simulate-paid disabled ---
def test_c3_simulate_paid_disabled(client, traveler_token):
    r = client.post(f"{BASE_URL}/api/payments/midtrans/simulate-paid/BK123",
                    headers={"Authorization": f"Bearer {traveler_token}"}, json={}, timeout=30)
    assert r.status_code == 404, f"{r.status_code}: {r.text[:300]}"


# --- C-2: webhook signature mandatory ---
def test_c2_webhook_without_signature_rejected(client):
    payload = {"order_id": "TRX-TEST-1", "transaction_status": "settlement",
               "status_code": "200", "gross_amount": "750000.00"}
    r = client.post(f"{BASE_URL}/api/payments/midtrans/notification", json=payload, timeout=30)
    assert r.status_code in (403, 503), f"{r.status_code}: {r.text[:300]}"
    assert "paid" not in r.text.lower() or r.status_code in (403, 503)


def test_c2_webhook_bogus_signature_rejected(client):
    payload = {"order_id": "TRX-TEST-2", "transaction_status": "settlement",
               "status_code": "200", "gross_amount": "750000.00", "signature_key": "deadbeef"}
    r = client.post(f"{BASE_URL}/api/payments/midtrans/notification", json=payload, timeout=30)
    assert r.status_code in (403, 503), f"{r.status_code}: {r.text[:300]}"


# --- C-6: AI endpoints require auth ---
@pytest.mark.parametrize("path,body", [
    ("/api/ai/assistant/chat", {"message": "halo"}),
    ("/api/ai/orchestrate", {"prompt": "x"}),
    ("/api/ai/safety/readiness", {}),
])
def test_c6_ai_requires_auth(client, path, body):
    r = requests.post(f"{BASE_URL}{path}", json=body, timeout=30)
    assert r.status_code == 401, f"{path} => {r.status_code}: {r.text[:300]}"


def test_c6_ai_chat_with_auth_not_401(client, traveler_token):
    r = requests.post(f"{BASE_URL}/api/ai/assistant/chat",
                      headers={"Authorization": f"Bearer {traveler_token}"},
                      json={"message": "rekomendasi trip gunung"}, timeout=90)
    assert r.status_code != 401, f"legit user blocked: {r.text[:300]}"
    print(f"ai chat with auth status={r.status_code} body={r.text[:200]}")


# --- Regression: public endpoint ---
def test_public_trips(client):
    r = client.get(f"{BASE_URL}/api/trips", timeout=30)
    assert r.status_code == 200, f"{r.status_code}: {r.text[:300]}"
    data = r.json()
    items = data if isinstance(data, list) else (data.get("trips") or data.get("data") or data.get("items") or [])
    if isinstance(items, dict):
        items = items.get("trips") or items.get("items") or []
    assert len(items) >= 1, f"no trips returned: {str(data)[:300]}"

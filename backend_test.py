#!/usr/bin/env python3
"""
Trexio Backend API Test Suite - FASE 1 Audit
Tests Supabase Auth, RBAC hardening, payment simulation removal, and persistence.
"""

import requests
import json
import random
import string
from datetime import datetime

BASE_URL = "http://localhost:3000/api"

def random_email():
    """Generate a unique email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"qa_{rand}@example.com"

def log_test(test_name, passed, details=""):
    """Log test results"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status}: {test_name}")
    if details:
        print(f"  Details: {details}")

def test_supabase_auth_register():
    """Test 1: Supabase Auth - Register new user"""
    print("\n" + "="*80)
    print("TEST 1: Supabase Auth - Register New User")
    print("="*80)
    
    email = random_email()
    payload = {
        "name": "QA Test User",
        "email": email,
        "password": "TestPass123",
        "confirmPassword": "TestPass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        # Check status code
        if response.status_code != 200:
            log_test("Register - Status Code", False, f"Expected 200, got {response.status_code}: {data}")
            return None, None
        log_test("Register - Status Code", True, "200 OK")
        
        # Check user object
        if "email" not in data or data["email"] != email:
            log_test("Register - Email", False, f"Email mismatch: {data.get('email')}")
            return None, None
        log_test("Register - Email", True, f"Email: {email}")
        
        # Check role is 'user' (not elevated)
        if data.get("role") != "user":
            log_test("Register - Role", False, f"Expected role='user', got '{data.get('role')}'")
            return None, None
        log_test("Register - Role", True, "role='user'")
        
        # Check supabase_uid exists
        if "supabase_uid" not in data or not data["supabase_uid"]:
            log_test("Register - Supabase UID", False, "supabase_uid missing or empty")
            return None, None
        log_test("Register - Supabase UID", True, f"supabase_uid: {data['supabase_uid']}")
        
        # Check token exists
        token = data.get("access_token") or data.get("token")
        if not token:
            log_test("Register - Token", False, "No access_token or token in response")
            return None, None
        log_test("Register - Token", True, "Token received")
        
        return email, token
        
    except Exception as e:
        log_test("Register - Exception", False, str(e))
        return None, None

def test_supabase_auth_login(email, password):
    """Test 2: Supabase Auth - Login with correct credentials"""
    print("\n" + "="*80)
    print("TEST 2: Supabase Auth - Login with Correct Credentials")
    print("="*80)
    
    payload = {
        "email": email,
        "password": password
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        data = response.json()
        
        # Check status code
        if response.status_code != 200:
            log_test("Login - Status Code", False, f"Expected 200, got {response.status_code}: {data}")
            return None
        log_test("Login - Status Code", True, "200 OK")
        
        # Check token exists
        token = data.get("access_token") or data.get("token")
        if not token:
            log_test("Login - Token", False, "No access_token or token in response")
            return None
        log_test("Login - Token", True, "Token received")
        
        # Check email matches
        if data.get("email") != email:
            log_test("Login - Email", False, f"Email mismatch: {data.get('email')}")
            return None
        log_test("Login - Email", True, f"Email: {email}")
        
        return token
        
    except Exception as e:
        log_test("Login - Exception", False, str(e))
        return None

def test_supabase_auth_login_wrong_password(email):
    """Test 3: Supabase Auth - Login with wrong password"""
    print("\n" + "="*80)
    print("TEST 3: Supabase Auth - Login with Wrong Password")
    print("="*80)
    
    payload = {
        "email": email,
        "password": "WrongPassword999"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        
        # Should return 401
        if response.status_code != 401:
            log_test("Login Wrong Password - Status Code", False, f"Expected 401, got {response.status_code}")
            return False
        log_test("Login Wrong Password - Status Code", True, "401 Unauthorized")
        return True
        
    except Exception as e:
        log_test("Login Wrong Password - Exception", False, str(e))
        return False

def test_supabase_auth_duplicate_email(email):
    """Test 4: Supabase Auth - Register with duplicate email"""
    print("\n" + "="*80)
    print("TEST 4: Supabase Auth - Register with Duplicate Email")
    print("="*80)
    
    payload = {
        "name": "Duplicate User",
        "email": email,
        "password": "TestPass123",
        "confirmPassword": "TestPass123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        
        # Should return 400
        if response.status_code != 400:
            log_test("Duplicate Email - Status Code", False, f"Expected 400, got {response.status_code}")
            return False
        log_test("Duplicate Email - Status Code", True, "400 Bad Request")
        return True
        
    except Exception as e:
        log_test("Duplicate Email - Exception", False, str(e))
        return False

def test_auth_me(token):
    """Test 5: GET /api/auth/me with token"""
    print("\n" + "="*80)
    print("TEST 5: GET /api/auth/me with Token")
    print("="*80)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        data = response.json()
        
        # Check status code
        if response.status_code != 200:
            log_test("Auth Me - Status Code", False, f"Expected 200, got {response.status_code}: {data}")
            return False
        log_test("Auth Me - Status Code", True, "200 OK")
        
        # Check user data exists
        if "email" not in data:
            log_test("Auth Me - User Data", False, "No email in response")
            return False
        log_test("Auth Me - User Data", True, f"User: {data.get('email')}")
        
        return True
        
    except Exception as e:
        log_test("Auth Me - Exception", False, str(e))
        return False

def test_rbac_privilege_escalation_super_admin():
    """Test 6: RBAC - Cannot self-register as super_admin"""
    print("\n" + "="*80)
    print("TEST 6: RBAC - Privilege Escalation Prevention (super_admin)")
    print("="*80)
    
    email = random_email()
    payload = {
        "name": "Malicious Super Admin",
        "email": email,
        "password": "TestPass123",
        "confirmPassword": "TestPass123",
        "role": "super_admin"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        # Should return 200 but with role='user'
        if response.status_code != 200:
            log_test("RBAC Super Admin - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        log_test("RBAC Super Admin - Status Code", True, "200 OK")
        
        # Check role is NOT super_admin
        if data.get("role") == "super_admin":
            log_test("RBAC Super Admin - Role Downgrade", False, f"SECURITY ISSUE: User registered as super_admin!")
            return False
        
        if data.get("role") != "user":
            log_test("RBAC Super Admin - Role Downgrade", False, f"Expected role='user', got '{data.get('role')}'")
            return False
        
        log_test("RBAC Super Admin - Role Downgrade", True, f"Role correctly set to 'user' (not super_admin)")
        return True
        
    except Exception as e:
        log_test("RBAC Super Admin - Exception", False, str(e))
        return False

def test_rbac_privilege_escalation_admin():
    """Test 7: RBAC - Cannot self-register as admin"""
    print("\n" + "="*80)
    print("TEST 7: RBAC - Privilege Escalation Prevention (admin)")
    print("="*80)
    
    email = random_email()
    payload = {
        "name": "Malicious Admin",
        "email": email,
        "password": "TestPass123",
        "confirmPassword": "TestPass123",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        # Should return 200 but with role='user'
        if response.status_code != 200:
            log_test("RBAC Admin - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        log_test("RBAC Admin - Status Code", True, "200 OK")
        
        # Check role is NOT admin
        if data.get("role") == "admin":
            log_test("RBAC Admin - Role Downgrade", False, f"SECURITY ISSUE: User registered as admin!")
            return False
        
        if data.get("role") != "user":
            log_test("RBAC Admin - Role Downgrade", False, f"Expected role='user', got '{data.get('role')}'")
            return False
        
        log_test("RBAC Admin - Role Downgrade", True, f"Role correctly set to 'user' (not admin)")
        return True
        
    except Exception as e:
        log_test("RBAC Admin - Exception", False, str(e))
        return False

def test_rbac_vendor_role_allowed():
    """Test 8: RBAC - Vendor role is allowed"""
    print("\n" + "="*80)
    print("TEST 8: RBAC - Vendor Role Allowed")
    print("="*80)
    
    email = random_email()
    payload = {
        "name": "Vendor User",
        "email": email,
        "password": "TestPass123",
        "confirmPassword": "TestPass123",
        "role": "vendor"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        # Should return 200 with role='vendor'
        if response.status_code != 200:
            log_test("RBAC Vendor - Status Code", False, f"Expected 200, got {response.status_code}")
            return None
        log_test("RBAC Vendor - Status Code", True, "200 OK")
        
        # Check role is 'vendor'
        if data.get("role") != "vendor":
            log_test("RBAC Vendor - Role", False, f"Expected role='vendor', got '{data.get('role')}'")
            return None
        log_test("RBAC Vendor - Role", True, "role='vendor'")
        
        # Return token for later use
        token = data.get("access_token") or data.get("token")
        return token
        
    except Exception as e:
        log_test("RBAC Vendor - Exception", False, str(e))
        return None

def test_payment_simulation_subscriptions(token):
    """Test 9: Payment Simulation - Subscriptions endpoint returns 410"""
    print("\n" + "="*80)
    print("TEST 9: Payment Simulation Removal - Subscriptions")
    print("="*80)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/subscriptions/simulate-paid/test_sub_123",
            headers=headers,
            timeout=10
        )
        
        # Should return 410 Gone
        if response.status_code != 410:
            log_test("Simulate Subscriptions - Status Code", False, f"Expected 410, got {response.status_code}")
            return False
        log_test("Simulate Subscriptions - Status Code", True, "410 Gone")
        return True
        
    except Exception as e:
        log_test("Simulate Subscriptions - Exception", False, str(e))
        return False

def test_payment_simulation_ads(vendor_token):
    """Test 10: Payment Simulation - Ads campaigns endpoint returns 410"""
    print("\n" + "="*80)
    print("TEST 10: Payment Simulation Removal - Ads Campaigns")
    print("="*80)
    
    headers = {
        "Authorization": f"Bearer {vendor_token}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/ads/campaigns/simulate-paid/test_campaign_123",
            headers=headers,
            timeout=10
        )
        
        # Should return 410 Gone
        if response.status_code != 410:
            log_test("Simulate Ads - Status Code", False, f"Expected 410, got {response.status_code}")
            return False
        log_test("Simulate Ads - Status Code", True, "410 Gone")
        return True
        
    except Exception as e:
        log_test("Simulate Ads - Exception", False, str(e))
        return False

def test_payment_simulation_midtrans(token):
    """Test 11: Payment Simulation - Midtrans endpoint returns 410"""
    print("\n" + "="*80)
    print("TEST 11: Payment Simulation Removal - Midtrans")
    print("="*80)
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/payments/midtrans/simulate-paid/test_booking_123",
            headers=headers,
            json={"payment_channel": "BCA Virtual Account"},
            timeout=10
        )
        
        # Should return 410 Gone
        if response.status_code != 410:
            log_test("Simulate Midtrans - Status Code", False, f"Expected 410, got {response.status_code}")
            return False
        log_test("Simulate Midtrans - Status Code", True, "410 Gone")
        return True
        
    except Exception as e:
        log_test("Simulate Midtrans - Exception", False, str(e))
        return False

def test_persistence():
    """Test 12: Persistence - Login works after register (data persists)"""
    print("\n" + "="*80)
    print("TEST 12: Durable Persistence - Login After Register")
    print("="*80)
    
    # Register a new user
    email = random_email()
    password = "TestPass123"
    
    register_payload = {
        "name": "Persistence Test User",
        "email": email,
        "password": password,
        "confirmPassword": password
    }
    
    try:
        # Register
        reg_response = requests.post(f"{BASE_URL}/auth/register", json=register_payload, timeout=10)
        if reg_response.status_code != 200:
            log_test("Persistence - Register", False, f"Register failed: {reg_response.status_code}")
            return False
        log_test("Persistence - Register", True, "User registered")
        
        # Login with same credentials
        login_payload = {
            "email": email,
            "password": password
        }
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=10)
        
        if login_response.status_code != 200:
            log_test("Persistence - Login After Register", False, f"Login failed: {login_response.status_code}")
            return False
        
        login_data = login_response.json()
        if login_data.get("email") != email:
            log_test("Persistence - Login After Register", False, "Email mismatch after login")
            return False
        
        log_test("Persistence - Login After Register", True, "User data persisted correctly")
        return True
        
    except Exception as e:
        log_test("Persistence - Exception", False, str(e))
        return False

def main():
    """Run all backend tests"""
    print("\n" + "="*80)
    print("TREXIO BACKEND API TEST SUITE - FASE 1 AUDIT")
    print("Testing: Supabase Auth, RBAC, Payment Simulation Removal, Persistence")
    print("="*80)
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    # Test 1-5: Supabase Auth flow
    email, token = test_supabase_auth_register()
    if email and token:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    if email and token:
        # Test 2: Login with correct password
        login_token = test_supabase_auth_login(email, "TestPass123")
        if login_token:
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
        
        # Test 3: Login with wrong password
        if test_supabase_auth_login_wrong_password(email):
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
        
        # Test 4: Duplicate email
        if test_supabase_auth_duplicate_email(email):
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
        
        # Test 5: Auth me
        if test_auth_me(token):
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
    else:
        # Skip tests 2-5 if registration failed
        results["failed"] += 4
        results["total"] += 4
        print("\n⚠️  Skipping tests 2-5 due to registration failure")
    
    # Test 6-8: RBAC hardening
    if test_rbac_privilege_escalation_super_admin():
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    if test_rbac_privilege_escalation_admin():
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    vendor_token = test_rbac_vendor_role_allowed()
    if vendor_token:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Test 9-11: Payment simulation removal
    if token:
        if test_payment_simulation_subscriptions(token):
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
        
        if test_payment_simulation_midtrans(token):
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
    else:
        results["failed"] += 2
        results["total"] += 2
        print("\n⚠️  Skipping payment simulation tests (subscriptions, midtrans) due to missing token")
    
    if vendor_token:
        if test_payment_simulation_ads(vendor_token):
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
    else:
        results["failed"] += 1
        results["total"] += 1
        print("\n⚠️  Skipping ads payment simulation test due to missing vendor token")
    
    # Test 12: Persistence
    if test_persistence():
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {results['total']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"Success Rate: {(results['passed']/results['total']*100):.1f}%")
    print("="*80)
    
    # Exit with appropriate code
    if results['failed'] > 0:
        exit(1)
    else:
        exit(0)

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Trexio Backend API Test Suite - FASE 2 + FASE 1 Regression
Tests trips/vendors persistence to Supabase Postgres + FASE 1 regression checks.
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

# ==========================================
# FASE 2 PRIMARY FOCUS: Trips/Vendors CRUD
# ==========================================

def test_fase2_1_register_vendor():
    """FASE 2 Test 1: Register a vendor with role=vendor"""
    print("\n" + "="*80)
    print("FASE 2 TEST 1: Register Vendor")
    print("="*80)
    
    email = f"qa_vendor_{random.randint(10000, 99999)}@example.com"
    payload = {
        "name": "QA Vendor Travel",
        "email": email,
        "password": "VendorPass123",
        "confirmPassword": "VendorPass123",
        "role": "vendor"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            log_test("Vendor Register - Status Code", False, f"Expected 200, got {response.status_code}: {data}")
            return None, None, None
        log_test("Vendor Register - Status Code", True, "200 OK")
        
        if data.get("role") != "vendor":
            log_test("Vendor Register - Role", False, f"Expected role='vendor', got '{data.get('role')}'")
            return None, None, None
        log_test("Vendor Register - Role", True, "role='vendor'")
        
        token = data.get("access_token") or data.get("token")
        if not token:
            log_test("Vendor Register - Token", False, "No token in response")
            return None, None, None
        log_test("Vendor Register - Token", True, "Token received")
        
        return email, token, data
        
    except Exception as e:
        log_test("Vendor Register - Exception", False, str(e))
        return None, None, None

def test_fase2_2_create_trip(vendor_token):
    """FASE 2 Test 2: Create a trip via POST /api/vendor/products"""
    print("\n" + "="*80)
    print("FASE 2 TEST 2: Create Trip/Product")
    print("="*80)
    
    headers = {
        "Authorization": f"Bearer {vendor_token}"
    }
    
    payload = {
        "title": "QA Rinjani Trip",
        "destination": "Lombok",
        "price": 1500000,
        "category": "open-trip",
        "duration": "3D2N"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/vendor/products", json=payload, headers=headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            log_test("Create Trip - Status Code", False, f"Expected 200, got {response.status_code}: {data}")
            return None
        log_test("Create Trip - Status Code", True, "200 OK")
        
        trip_id = data.get("id")
        if not trip_id or not trip_id.startswith("trip_"):
            log_test("Create Trip - ID Format", False, f"Expected trip_xxx format, got '{trip_id}'")
            return None
        log_test("Create Trip - ID Format", True, f"trip_id: {trip_id}")
        
        if data.get("title") != "QA Rinjani Trip":
            log_test("Create Trip - Title", False, f"Title mismatch: {data.get('title')}")
            return None
        log_test("Create Trip - Title", True, "Title: QA Rinjani Trip")
        
        if data.get("price") != 1500000:
            log_test("Create Trip - Price", False, f"Price mismatch: {data.get('price')}")
            return None
        log_test("Create Trip - Price", True, "Price: 1500000")
        
        return trip_id
        
    except Exception as e:
        log_test("Create Trip - Exception", False, str(e))
        return None

def test_fase2_3_get_trips_includes_new(trip_id):
    """FASE 2 Test 3: GET /api/trips includes the newly created trip"""
    print("\n" + "="*80)
    print("FASE 2 TEST 3: GET /api/trips - Verify New Trip Appears")
    print("="*80)
    
    try:
        response = requests.get(f"{BASE_URL}/trips", timeout=10)
        
        if response.status_code != 200:
            log_test("GET Trips - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        log_test("GET Trips - Status Code", True, "200 OK")
        
        trips = response.json()
        if not isinstance(trips, list):
            log_test("GET Trips - Response Type", False, "Expected array of trips")
            return False
        log_test("GET Trips - Response Type", True, f"Received {len(trips)} trips")
        
        found_trip = None
        for trip in trips:
            if trip.get("id") == trip_id:
                found_trip = trip
                break
        
        if not found_trip:
            log_test("GET Trips - Trip Found", False, f"Trip {trip_id} not found in list")
            return False
        log_test("GET Trips - Trip Found", True, f"Trip {trip_id} found with title: {found_trip.get('title')}")
        
        if found_trip.get("title") != "QA Rinjani Trip":
            log_test("GET Trips - Trip Title", False, f"Title mismatch: {found_trip.get('title')}")
            return False
        log_test("GET Trips - Trip Title", True, "Title matches: QA Rinjani Trip")
        
        return True
        
    except Exception as e:
        log_test("GET Trips - Exception", False, str(e))
        return False

def test_fase2_4_update_trip(vendor_token, trip_id):
    """FASE 2 Test 4: Update trip via PATCH /api/vendor/products/:id"""
    print("\n" + "="*80)
    print("FASE 2 TEST 4: Update Trip/Product")
    print("="*80)
    
    headers = {
        "Authorization": f"Bearer {vendor_token}"
    }
    
    payload = {
        "title": "QA Rinjani Trip UPDATED"
    }
    
    try:
        response = requests.patch(f"{BASE_URL}/vendor/products/{trip_id}", json=payload, headers=headers, timeout=10)
        data = response.json()
        
        if response.status_code != 200:
            log_test("Update Trip - Status Code", False, f"Expected 200, got {response.status_code}: {data}")
            return False
        log_test("Update Trip - Status Code", True, "200 OK")
        
        if data.get("title") != "QA Rinjani Trip UPDATED":
            log_test("Update Trip - Title", False, f"Title not updated: {data.get('title')}")
            return False
        log_test("Update Trip - Title", True, "Title updated: QA Rinjani Trip UPDATED")
        
        # Verify update persisted via GET /api/trips
        get_response = requests.get(f"{BASE_URL}/trips", timeout=10)
        if get_response.status_code == 200:
            trips = get_response.json()
            found_trip = next((t for t in trips if t.get("id") == trip_id), None)
            if found_trip and found_trip.get("title") == "QA Rinjani Trip UPDATED":
                log_test("Update Trip - Persistence Check", True, "Updated title appears in GET /api/trips")
            else:
                log_test("Update Trip - Persistence Check", False, "Updated title not found in GET /api/trips")
                return False
        
        return True
        
    except Exception as e:
        log_test("Update Trip - Exception", False, str(e))
        return False

def test_fase2_5_delete_trip(vendor_token, trip_id):
    """FASE 2 Test 5: Delete trip via DELETE /api/vendor/products/:id"""
    print("\n" + "="*80)
    print("FASE 2 TEST 5: Delete Trip/Product")
    print("="*80)
    
    headers = {
        "Authorization": f"Bearer {vendor_token}"
    }
    
    try:
        response = requests.delete(f"{BASE_URL}/vendor/products/{trip_id}", headers=headers, timeout=10)
        
        if response.status_code != 200:
            log_test("Delete Trip - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        log_test("Delete Trip - Status Code", True, "200 OK")
        
        # Verify deletion persisted via GET /api/trips
        get_response = requests.get(f"{BASE_URL}/trips", timeout=10)
        if get_response.status_code == 200:
            trips = get_response.json()
            found_trip = next((t for t in trips if t.get("id") == trip_id), None)
            if found_trip:
                log_test("Delete Trip - Persistence Check", False, f"Trip {trip_id} still appears in GET /api/trips")
                return False
            else:
                log_test("Delete Trip - Persistence Check", True, "Trip successfully removed from GET /api/trips")
        
        return True
        
    except Exception as e:
        log_test("Delete Trip - Exception", False, str(e))
        return False

# ==========================================
# FASE 1 REGRESSION CHECKS
# ==========================================

def test_regression_user_register_login():
    """FASE 1 Regression: User registration and login"""
    print("\n" + "="*80)
    print("FASE 1 REGRESSION: User Register + Login")
    print("="*80)
    
    email = random_email()
    password = "TestPass123"
    
    # Register
    reg_payload = {
        "name": "QA Regression User",
        "email": email,
        "password": password,
        "confirmPassword": password
    }
    
    try:
        reg_response = requests.post(f"{BASE_URL}/auth/register", json=reg_payload, timeout=10)
        if reg_response.status_code != 200:
            log_test("Regression Register - Status", False, f"Register failed: {reg_response.status_code}")
            return None
        
        reg_data = reg_response.json()
        if not reg_data.get("supabase_uid"):
            log_test("Regression Register - Supabase UID", False, "No supabase_uid in response")
            return None
        log_test("Regression Register - Supabase UID", True, f"supabase_uid: {reg_data['supabase_uid']}")
        
        token = reg_data.get("access_token") or reg_data.get("token")
        if not token:
            log_test("Regression Register - Token", False, "No token in response")
            return None
        log_test("Regression Register - Token", True, "Token received")
        
        # Login with correct password
        login_payload = {"email": email, "password": password}
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_payload, timeout=10)
        if login_response.status_code != 200:
            log_test("Regression Login - Correct Password", False, f"Login failed: {login_response.status_code}")
            return None
        log_test("Regression Login - Correct Password", True, "Login successful")
        
        # Login with wrong password
        wrong_login_payload = {"email": email, "password": "WrongPassword999"}
        wrong_response = requests.post(f"{BASE_URL}/auth/login", json=wrong_login_payload, timeout=10)
        if wrong_response.status_code != 401:
            log_test("Regression Login - Wrong Password", False, f"Expected 401, got {wrong_response.status_code}")
            return None
        log_test("Regression Login - Wrong Password", True, "401 Unauthorized")
        
        # Duplicate email registration
        dup_response = requests.post(f"{BASE_URL}/auth/register", json=reg_payload, timeout=10)
        if dup_response.status_code != 400:
            log_test("Regression Register - Duplicate Email", False, f"Expected 400, got {dup_response.status_code}")
            return None
        log_test("Regression Register - Duplicate Email", True, "400 Bad Request")
        
        return token
        
    except Exception as e:
        log_test("Regression User Auth - Exception", False, str(e))
        return None

def test_regression_rbac():
    """FASE 1 Regression: RBAC hardening"""
    print("\n" + "="*80)
    print("FASE 1 REGRESSION: RBAC Hardening")
    print("="*80)
    
    # Test super_admin role prevention
    email_super = random_email()
    payload_super = {
        "name": "Malicious Super Admin",
        "email": email_super,
        "password": "TestPass123",
        "confirmPassword": "TestPass123",
        "role": "super_admin"
    }
    
    try:
        response_super = requests.post(f"{BASE_URL}/auth/register", json=payload_super, timeout=10)
        data_super = response_super.json()
        
        if response_super.status_code != 200:
            log_test("RBAC Super Admin - Status", False, f"Expected 200, got {response_super.status_code}")
            return False
        
        if data_super.get("role") == "super_admin":
            log_test("RBAC Super Admin - Role", False, "SECURITY ISSUE: User registered as super_admin!")
            return False
        
        if data_super.get("role") != "user":
            log_test("RBAC Super Admin - Role", False, f"Expected role='user', got '{data_super.get('role')}'")
            return False
        log_test("RBAC Super Admin - Role", True, "Role correctly set to 'user' (not super_admin)")
        
        # Test admin role prevention
        email_admin = random_email()
        payload_admin = {
            "name": "Malicious Admin",
            "email": email_admin,
            "password": "TestPass123",
            "confirmPassword": "TestPass123",
            "role": "admin"
        }
        
        response_admin = requests.post(f"{BASE_URL}/auth/register", json=payload_admin, timeout=10)
        data_admin = response_admin.json()
        
        if response_admin.status_code != 200:
            log_test("RBAC Admin - Status", False, f"Expected 200, got {response_admin.status_code}")
            return False
        
        if data_admin.get("role") == "admin":
            log_test("RBAC Admin - Role", False, "SECURITY ISSUE: User registered as admin!")
            return False
        
        if data_admin.get("role") != "user":
            log_test("RBAC Admin - Role", False, f"Expected role='user', got '{data_admin.get('role')}'")
            return False
        log_test("RBAC Admin - Role", True, "Role correctly set to 'user' (not admin)")
        
        return True
        
    except Exception as e:
        log_test("RBAC Regression - Exception", False, str(e))
        return False

def test_regression_simulate_paid_endpoints(user_token, vendor_token):
    """FASE 1 Regression: All 3 simulate-paid endpoints return 410"""
    print("\n" + "="*80)
    print("FASE 1 REGRESSION: Payment Simulation Endpoints (410)")
    print("="*80)
    
    headers_user = {"Authorization": f"Bearer {user_token}"}
    headers_vendor = {"Authorization": f"Bearer {vendor_token}"}
    
    try:
        # Test 1: POST /api/subscriptions/simulate-paid/:id
        response1 = requests.post(
            f"{BASE_URL}/subscriptions/simulate-paid/test_sub_123",
            headers=headers_user,
            timeout=10
        )
        if response1.status_code != 410:
            log_test("Simulate Subscriptions - 410", False, f"Expected 410, got {response1.status_code}")
            return False
        log_test("Simulate Subscriptions - 410", True, "410 Gone")
        
        # Test 2: POST /api/ads/campaigns/simulate-paid/:id
        response2 = requests.post(
            f"{BASE_URL}/ads/campaigns/simulate-paid/test_campaign_123",
            headers=headers_vendor,
            timeout=10
        )
        if response2.status_code != 410:
            log_test("Simulate Ads - 410", False, f"Expected 410, got {response2.status_code}")
            return False
        log_test("Simulate Ads - 410", True, "410 Gone")
        
        # Test 3: POST /api/payments/midtrans/simulate-paid/:id
        response3 = requests.post(
            f"{BASE_URL}/payments/midtrans/simulate-paid/test_booking_123",
            headers=headers_user,
            json={"payment_channel": "BCA Virtual Account"},
            timeout=10
        )
        if response3.status_code != 410:
            log_test("Simulate Midtrans - 410", False, f"Expected 410, got {response3.status_code}")
            return False
        log_test("Simulate Midtrans - 410", True, "410 Gone")
        
        return True
        
    except Exception as e:
        log_test("Simulate Paid Endpoints - Exception", False, str(e))
        return False

# ==========================================
# MAIN TEST RUNNER
# ==========================================

def main():
    """Run all FASE 2 + FASE 1 regression tests"""
    print("\n" + "="*80)
    print("TREXIO BACKEND API TEST SUITE - FASE 2 + FASE 1 REGRESSION")
    print("Testing: Trips/Vendors Persistence + Auth/RBAC/Payment Simulation")
    print("="*80)
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 0
    }
    
    # ==========================================
    # FASE 2 PRIMARY FOCUS: Trips/Vendors CRUD
    # ==========================================
    
    print("\n" + "="*80)
    print("FASE 2 PRIMARY FOCUS: TRIPS/VENDORS PERSISTENCE")
    print("="*80)
    
    # Test 1: Register vendor
    vendor_email, vendor_token, vendor_data = test_fase2_1_register_vendor()
    if vendor_token:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    trip_id = None
    if vendor_token:
        # Test 2: Create trip
        trip_id = test_fase2_2_create_trip(vendor_token)
        if trip_id:
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
        
        if trip_id:
            # Test 3: GET /api/trips includes new trip
            if test_fase2_3_get_trips_includes_new(trip_id):
                results["passed"] += 1
            else:
                results["failed"] += 1
            results["total"] += 1
            
            # Test 4: Update trip
            if test_fase2_4_update_trip(vendor_token, trip_id):
                results["passed"] += 1
            else:
                results["failed"] += 1
            results["total"] += 1
            
            # Test 5: Delete trip
            if test_fase2_5_delete_trip(vendor_token, trip_id):
                results["passed"] += 1
            else:
                results["failed"] += 1
            results["total"] += 1
        else:
            # Skip tests 3-5 if trip creation failed
            results["failed"] += 3
            results["total"] += 3
            print("\n⚠️  Skipping tests 3-5 due to trip creation failure")
    else:
        # Skip tests 2-5 if vendor registration failed
        results["failed"] += 4
        results["total"] += 4
        print("\n⚠️  Skipping tests 2-5 due to vendor registration failure")
    
    # ==========================================
    # FASE 1 REGRESSION CHECKS
    # ==========================================
    
    print("\n" + "="*80)
    print("FASE 1 REGRESSION CHECKS")
    print("="*80)
    
    # Test 6: User registration and login
    user_token = test_regression_user_register_login()
    if user_token:
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Test 7: RBAC hardening
    if test_regression_rbac():
        results["passed"] += 1
    else:
        results["failed"] += 1
    results["total"] += 1
    
    # Test 8: Payment simulation endpoints
    if user_token and vendor_token:
        if test_regression_simulate_paid_endpoints(user_token, vendor_token):
            results["passed"] += 1
        else:
            results["failed"] += 1
        results["total"] += 1
    else:
        results["failed"] += 1
        results["total"] += 1
        print("\n⚠️  Skipping payment simulation test due to missing tokens")
    
    # ==========================================
    # PRINT SUMMARY
    # ==========================================
    
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

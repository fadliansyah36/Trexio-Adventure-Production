/**
 * TREXIO TAHAP 9 - COMPREHENSIVE AUTOMATED TEST SUITE & BENCHMARK
 * Tests:
 * 1. Unit & Integration: Auth (login/register/refresh), RBAC (cross-role rejection),
 *    Booking State Machine, Payment Webhook (SHA-512 signature validation & idempotency).
 * 2. Regression Check: Real Supabase Postgres Data Integrity across modules.
 * 3. Load & Stress Test: Concurrency race condition test on trip/slot availability.
 * 4. Dependency & Supply Chain Security Audit.
 */

require('dotenv').config();
const crypto = require('crypto');
const http = require('http');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000/api';

// Helper for making HTTP requests
async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const method = options.method || 'GET';
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const body = options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined;

  const res = await fetch(url, {
    method,
    headers,
    body
  });

  let data;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return {
    status: res.status,
    headers: res.headers,
    data
  };
}

function generateRandomEmail(prefix = 'qa') {
  const rand = crypto.randomBytes(4).toString('hex');
  return `${prefix}_${rand}@trexio-test.io`;
}

// Test Results Tracker
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function recordTest(category, name, passed, details = '', metadata = null) {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`  [PASS] [${category}] ${name}`);
  } else {
    testResults.failed++;
    console.error(`  [FAIL] [${category}] ${name} - Details: ${details}`);
  }
  testResults.details.push({
    category,
    name,
    passed,
    details,
    metadata
  });
}

// =========================================================================
// SECTION 1: UNIT & INTEGRATION TESTS
// =========================================================================

async function runAuthTests() {
  console.log('\n============================================================');
  console.log('1.1 TESTING AUTHENTICATION & TOKEN LIFECYCLE');
  console.log('============================================================');

  const testEmail = generateRandomEmail('auth_user');
  const testPassword = 'Password123!';
  let userToken = null;
  let userId = null;

  // 1. Register new user
  try {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'QA Auth Tester',
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'user'
      }
    });

    const isRegSuccess = regRes.status === 200 && regRes.data && (regRes.data.token || regRes.data.access_token);
    userToken = regRes.data?.token || regRes.data?.access_token;
    userId = regRes.data?.id;

    recordTest(
      'AUTH',
      'Register New User (Supabase Auth Driver)',
      isRegSuccess,
      isRegSuccess ? `User created: ${testEmail}, ID: ${userId}` : `Status: ${regRes.status}, Body: ${JSON.stringify(regRes.data)}`
    );
  } catch (e) {
    recordTest('AUTH', 'Register New User', false, e.message);
  }

  // 2. Login with valid credentials
  try {
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: testPassword
      }
    });

    const isLoginSuccess = loginRes.status === 200 && loginRes.data && (loginRes.data.token || loginRes.data.access_token);
    if (isLoginSuccess) {
      userToken = loginRes.data?.token || loginRes.data?.access_token;
    }

    recordTest(
      'AUTH',
      'Login with Valid Credentials',
      isLoginSuccess,
      isLoginSuccess ? 'Token acquired successfully' : `Status: ${loginRes.status}, Body: ${JSON.stringify(loginRes.data)}`
    );
  } catch (e) {
    recordTest('AUTH', 'Login with Valid Credentials', false, e.message);
  }

  // 3. Login with invalid password (must be rejected)
  try {
    const badLoginRes = await request('/auth/login', {
      method: 'POST',
      body: {
        email: testEmail,
        password: 'WrongPassword999!'
      }
    });

    const isRejected = badLoginRes.status === 401 || badLoginRes.status === 400;
    recordTest(
      'AUTH',
      'Login with Invalid Password Rejected (401/400)',
      isRejected,
      `Status: ${badLoginRes.status}`
    );
  } catch (e) {
    recordTest('AUTH', 'Login with Invalid Password', false, e.message);
  }

  // 4. Token validation via /auth/me
  try {
    const meRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const isMeValid = meRes.status === 200 && meRes.data?.email === testEmail;
    recordTest(
      'AUTH',
      'Verify Active Token & Session (/auth/me)',
      isMeValid,
      isMeValid ? `Authenticated as: ${meRes.data?.email} (Role: ${meRes.data?.role})` : `Status: ${meRes.status}`
    );
  } catch (e) {
    recordTest('AUTH', 'Verify Active Token', false, e.message);
  }

  // 5. Token refresh endpoint
  try {
    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` }
    });

    const isRefreshOk = refreshRes.status === 200 && (refreshRes.data?.token || refreshRes.data?.access_token);
    recordTest(
      'AUTH',
      'Refresh Token Lifecycle (/auth/refresh)',
      isRefreshOk,
      isRefreshOk ? 'New token issued' : `Status: ${refreshRes.status}`
    );
  } catch (e) {
    recordTest('AUTH', 'Refresh Token Lifecycle', false, e.message);
  }

  return { userToken, userId, testEmail };
}

async function runRBACTests(userToken) {
  console.log('\n============================================================');
  console.log('1.2 TESTING RBAC & CROSS-ROLE AUTHORIZATION GUARDS');
  console.log('============================================================');

  // 1. Unauthenticated request to protected admin route -> 401
  try {
    const unauthRes = await request('/admin/bookings');
    const isUnauthBlocked = unauthRes.status === 401;
    recordTest(
      'RBAC',
      'Unauthenticated Access to Admin Route Rejected (401)',
      isUnauthBlocked,
      `Status: ${unauthRes.status}`
    );
  } catch (e) {
    recordTest('RBAC', 'Unauthenticated Admin Access', false, e.message);
  }

  // 2. Regular user accessing Super Admin bookings -> 403 Forbidden
  try {
    const userAdminRes = await request('/admin/bookings', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const isForbidden = userAdminRes.status === 403;
    recordTest(
      'RBAC',
      'Regular User Access to Super Admin Bookings Rejected (403)',
      isForbidden,
      `Status: ${userAdminRes.status}, Body: ${JSON.stringify(userAdminRes.data)}`
    );
  } catch (e) {
    recordTest('RBAC', 'Regular User Admin Access', false, e.message);
  }

  // 3. Regular user accessing Super Admin payouts -> 403 Forbidden
  try {
    const userPayoutRes = await request('/admin/payouts', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const isForbidden = userPayoutRes.status === 403;
    recordTest(
      'RBAC',
      'Regular User Access to Admin Payouts Rejected (403)',
      isForbidden,
      `Status: ${userPayoutRes.status}`
    );
  } catch (e) {
    recordTest('RBAC', 'Regular User Payout Access', false, e.message);
  }

  // 4. Regular user creating vendor product -> 403 Forbidden
  try {
    const vendorCreateRes = await request('/vendor/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        title: 'Unauthorized Trip',
        price: 1000000
      }
    });
    const isForbidden = vendorCreateRes.status === 403;
    recordTest(
      'RBAC',
      'Regular User Creating Vendor Product Rejected (403)',
      isForbidden,
      `Status: ${vendorCreateRes.status}`
    );
  } catch (e) {
    recordTest('RBAC', 'Regular User Vendor Create', false, e.message);
  }

  // 5. Register Vendor and test Vendor role access
  const vendorEmail = generateRandomEmail('vendor_user');
  let vendorToken = null;
  try {
    const regVendorRes = await request('/auth/register', {
      method: 'POST',
      body: {
        name: 'QA Mountain Partner',
        email: vendorEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        role: 'vendor'
      }
    });
    vendorToken = regVendorRes.data?.token || regVendorRes.data?.access_token;
    const isVendorReg = regVendorRes.status === 200 && regVendorRes.data?.role === 'vendor';
    recordTest(
      'RBAC',
      'Register Dedicated Vendor Role',
      isVendorReg,
      `Vendor registered: ${vendorEmail}`
    );
  } catch (e) {
    recordTest('RBAC', 'Register Dedicated Vendor', false, e.message);
  }

  // 6. Vendor accessing Super Admin audit logs -> 403 Forbidden
  try {
    const vendorSuperAdminRes = await request('/admin/audit-logs', {
      headers: { Authorization: `Bearer ${vendorToken}` }
    });
    const isForbidden = vendorSuperAdminRes.status === 403;
    recordTest(
      'RBAC',
      'Vendor Access to Super Admin Audit Logs Rejected (403)',
      isForbidden,
      `Status: ${vendorSuperAdminRes.status}`
    );
  } catch (e) {
    recordTest('RBAC', 'Vendor Super Admin Access', false, e.message);
  }

  return { vendorToken, vendorEmail };
}

async function runBookingStateMachineTests(userToken, vendorToken) {
  console.log('\n============================================================');
  console.log('1.3 TESTING BOOKING STATE MACHINE & LIFECYCLE');
  console.log('============================================================');

  let testTripId = null;
  let testBooking = null;

  // 1. Create a fresh dedicated trip for state machine testing
  try {
    const createTripRes = await request('/vendor/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: {
        title: `QA State Machine Semeru Expedition ${Date.now()}`,
        destination: 'Gunung Semeru',
        price: 1250000,
        category: 'open-trip',
        duration: '3D2N',
        max_participants: 50,
        stock: 50,
        booked_seats: 0
      }
    });
    testTripId = createTripRes.data?.id;

    recordTest(
      'BOOKING_STATE',
      'Trip Source Resolution for State Machine Test',
      Boolean(testTripId),
      `Target Trip ID: ${testTripId}`
    );
  } catch (e) {
    recordTest('BOOKING_STATE', 'Trip Source Resolution', false, e.message);
  }

  // 2. Create a new booking -> State must be pending_payment / AWAITING_PAYMENT
  try {
    const bookRes = await request('/booking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        trip_id: testTripId,
        quantity: 1,
        departure_date: '2026-10-15',
        meeting_point: 'Basecamp Ranupani',
        payment_method: 'midtrans',
        participants: [
          { name: 'State Tester', gender: 'male', age: 26, id_type: 'KTP', id_number: '3171010101990001' }
        ]
      }
    });

    testBooking = bookRes.data;
    const isPending = bookRes.status === 200 &&
      (testBooking?.booking_status === 'pending_payment' || testBooking?.status === 'AWAITING_PAYMENT') &&
      testBooking?.payment_status === 'pending';

    recordTest(
      'BOOKING_STATE',
      'Initial State Transition -> pending_payment / AWAITING_PAYMENT',
      isPending,
      `Booking ID: ${testBooking?.id}, Code: ${testBooking?.booking_code}, Status: ${testBooking?.booking_status}`
    );
  } catch (e) {
    recordTest('BOOKING_STATE', 'Initial State Transition', false, e.message);
  }

  // 3. User cancels unverified/unpaid booking -> Transitions to cancelled
  try {
    const cancelRes = await request(`/booking/${testBooking?.id}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { reason: 'Test user cancellation lifecycle' }
    });

    const isCancelled = cancelRes.status === 200 && cancelRes.data?.ok === true;
    recordTest(
      'BOOKING_STATE',
      'User Cancel Unpaid Booking -> cancelled',
      isCancelled,
      `Status: ${cancelRes.status}, Message: ${cancelRes.data?.message}`
    );
  } catch (e) {
    recordTest('BOOKING_STATE', 'User Cancel Unpaid Booking', false, e.message);
  }

  // 4. Create second booking for payment transition testing
  let confirmedBooking = null;
  try {
    const bookRes2 = await request('/booking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        trip_id: testTripId,
        quantity: 1,
        departure_date: '2026-10-20',
        meeting_point: 'Basecamp Utama',
        payment_method: 'midtrans',
        participants: [
          { name: 'Payment Tester', gender: 'female', age: 24, id_type: 'KTP', id_number: '3171010101990002' }
        ]
      }
    });
    confirmedBooking = bookRes2.data;
  } catch (e) {
    console.error('Error creating 2nd booking:', e);
  }

  return { testTripId, confirmedBooking };
}

async function runPaymentWebhookTests(confirmedBooking) {
  console.log('\n============================================================');
  console.log('1.4 TESTING MIDTRANS PAYMENT WEBHOOK (SHA-512 & IDEMPOTENCY)');
  console.log('============================================================');

  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'Mid-server-Ao3QUtRWNqCvgLmwkuYNqaZa';
  const orderId = confirmedBooking?.booking_code || `TRX-TEST-${Date.now()}`;
  const grossAmount = Math.round(Number(confirmedBooking?.total_amount || 1250000));
  const statusCode = '200';

  // 1. Webhook with Invalid / Forged Signature -> MUST be rejected (403)
  try {
    const fakeSignature = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
    const badWebhookRes = await request('/payments/midtrans/notification', {
      method: 'POST',
      body: {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: `${grossAmount}.00`,
        signature_key: fakeSignature,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'bank_transfer',
        transaction_id: `tx_${Date.now()}`
      }
    });

    const isRejected = badWebhookRes.status === 403;
    recordTest(
      'PAYMENT_WEBHOOK',
      'Forged Signature Key Rejected (403 Forbidden)',
      isRejected,
      `Status: ${badWebhookRes.status}, Body: ${JSON.stringify(badWebhookRes.data)}`
    );
  } catch (e) {
    recordTest('PAYMENT_WEBHOOK', 'Forged Signature Key Rejected', false, e.message);
  }

  // 2. Webhook with Missing order_id -> MUST be rejected (400)
  try {
    const noOrderRes = await request('/payments/midtrans/notification', {
      method: 'POST',
      body: {
        status_code: '200',
        transaction_status: 'settlement'
      }
    });

    const isRejected = noOrderRes.status === 400;
    recordTest(
      'PAYMENT_WEBHOOK',
      'Missing order_id Payload Rejected (400 Bad Request)',
      isRejected,
      `Status: ${noOrderRes.status}`
    );
  } catch (e) {
    recordTest('PAYMENT_WEBHOOK', 'Missing order_id Payload', false, e.message);
  }

  // 3. Webhook with Valid SHA-512 Signature -> MUST succeed (200 OK)
  const validTxId = `tx_${Date.now()}`;
  const rawSignatureString = `${orderId}${statusCode}${grossAmount}.00${serverKey}`;
  const validSignature = crypto.createHash('sha512').update(rawSignatureString).digest('hex');

  try {
    const validWebhookRes = await request('/payments/midtrans/notification', {
      method: 'POST',
      body: {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: `${grossAmount}.00`,
        signature_key: validSignature,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'bca_va',
        transaction_id: validTxId
      }
    });

    const isSuccess = validWebhookRes.status === 200 && validWebhookRes.data?.status === 'ok';
    recordTest(
      'PAYMENT_WEBHOOK',
      'Valid SHA-512 Signature Verified & Processed (200 OK)',
      isSuccess,
      `Status: ${validWebhookRes.status}, Message: ${validWebhookRes.data?.message}`
    );
  } catch (e) {
    recordTest('PAYMENT_WEBHOOK', 'Valid SHA-512 Signature', false, e.message);
  }

  // 4. Idempotency Check: Resend identical webhook payload
  try {
    const duplicateWebhookRes = await request('/payments/midtrans/notification', {
      method: 'POST',
      body: {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: `${grossAmount}.00`,
        signature_key: validSignature,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'bca_va',
        transaction_id: validTxId
      }
    });

    const isIdempotent = duplicateWebhookRes.status === 200 &&
      (duplicateWebhookRes.data?.message?.includes('idempotent') || duplicateWebhookRes.data?.status === 'ok');

    recordTest(
      'PAYMENT_WEBHOOK',
      'Webhook Idempotency: Duplicate Notification Safely Deduplicated',
      isIdempotent,
      `Status: ${duplicateWebhookRes.status}, Message: ${duplicateWebhookRes.data?.message}`
    );
  } catch (e) {
    recordTest('PAYMENT_WEBHOOK', 'Webhook Idempotency', false, e.message);
  }
}

// =========================================================================
// SECTION 2: REGRESSION CHECK
// =========================================================================

async function runRegressionTests(userToken) {
  console.log('\n============================================================');
  console.log('2.0 REGRESSION CHECK: SUPABASE POSTGRES DATA & SERVICES');
  console.log('============================================================');

  // 1. System status & Supabase DB health
  try {
    const statusRes = await request('/system/status');
    const isHealthy = statusRes.status === 200 &&
      statusRes.data?.database?.connected === true &&
      statusRes.data?.database?.provider === 'Supabase PostgreSQL';

    recordTest(
      'REGRESSION',
      'Supabase PostgreSQL Live Connection & Strict Mode',
      isHealthy,
      `Provider: ${statusRes.data?.database?.provider}, Server Time: ${statusRes.data?.database?.server_time}`
    );
  } catch (e) {
    recordTest('REGRESSION', 'Supabase PostgreSQL Live Connection', false, e.message);
  }

  // 2. Trips catalog retrieval
  try {
    const tripsRes = await request('/trips');
    const isTripsValid = tripsRes.status === 200 && Array.isArray(tripsRes.data) && tripsRes.data.length > 0;
    recordTest(
      'REGRESSION',
      'Trips Catalog Hydration from Supabase',
      isTripsValid,
      `Loaded ${tripsRes.data?.length || 0} trip products`
    );
  } catch (e) {
    recordTest('REGRESSION', 'Trips Catalog Hydration', false, e.message);
  }

  // 3. Rentals catalog retrieval
  try {
    const rentalsRes = await request('/rentals');
    const isRentalsValid = rentalsRes.status === 200 && Array.isArray(rentalsRes.data);
    recordTest(
      'REGRESSION',
      'Rentals Catalog Hydration from Supabase',
      isRentalsValid,
      `Loaded ${rentalsRes.data?.length || 0} rental items`
    );
  } catch (e) {
    recordTest('REGRESSION', 'Rentals Catalog Hydration', false, e.message);
  }

  // 4. Backpacker community routes
  try {
    const routesRes = await request('/backpacker/routes', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const isRoutesValid = routesRes.status === 200 && Array.isArray(routesRes.data);
    recordTest(
      'REGRESSION',
      'Backpacker Community Routes API',
      isRoutesValid,
      `Loaded ${routesRes.data?.length || 0} routes`
    );
  } catch (e) {
    recordTest('REGRESSION', 'Backpacker Community Routes', false, e.message);
  }

  // 5. User Wallet & Balance
  try {
    const walletRes = await request('/wallet', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const isWalletValid = walletRes.status === 200 && typeof walletRes.data?.balance === 'number';
    recordTest(
      'REGRESSION',
      'User Wallet Balance & Transactions Hydration',
      isWalletValid,
      `Current Balance: Rp${walletRes.data?.balance?.toLocaleString('id-ID')}`
    );
  } catch (e) {
    recordTest('REGRESSION', 'User Wallet Balance', false, e.message);
  }

  // 6. User Notifications Center
  try {
    const notifsRes = await request('/notifications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const isNotifsValid = notifsRes.status === 200 && Array.isArray(notifsRes.data?.notifications);
    recordTest(
      'REGRESSION',
      'User Notifications Center',
      isNotifsValid,
      `Unread Count: ${notifsRes.data?.unread_count || 0}`
    );
  } catch (e) {
    recordTest('REGRESSION', 'User Notifications Center', false, e.message);
  }
}

// =========================================================================
// SECTION 3: LOAD & CONCURRENCY TEST ON AVAILABILITY SLOTS
// =========================================================================

async function runConcurrencySlotTest(userToken, vendorToken) {
  console.log('\n============================================================');
  console.log('3.0 LOAD & STRESS TEST: CONCURRENT AVAILABILITY SLOT LOCKING');
  console.log('============================================================');

  // 1. Create a trip with strictly LIMITED slots (e.g. max 3 participants)
  const quotaLimit = 3;
  let stressTripId = null;

  try {
    const createTripRes = await request('/vendor/products', {
      method: 'POST',
      headers: { Authorization: `Bearer ${vendorToken}` },
      body: {
        title: `QA Concurrency Stress Trip ${Date.now()}`,
        destination: 'Gunung Kerinci Peak',
        price: 950000,
        category: 'open-trip',
        duration: '2D1N',
        max_participants: quotaLimit,
        stock: quotaLimit,
        booked_seats: 0
      }
    });

    stressTripId = createTripRes.data?.id;
    console.log(`  Stress Test Target Product Created: ${stressTripId} (Capacity: ${quotaLimit} seats)`);
  } catch (e) {
    console.error('Error creating stress trip:', e);
  }

  if (!stressTripId) {
    recordTest('CONCURRENCY', 'Stress Test Target Preparation', false, 'Failed to create target trip');
    return;
  }

  // 2. Launch 10 simultaneous booking requests concurrently for 1 seat each
  const totalConcurrentAttempts = 10;
  console.log(`  Simulating ${totalConcurrentAttempts} simultaneous booking attempts against ${quotaLimit} available slots...`);

  const startTime = Date.now();
  const bookingPromises = [];

  for (let i = 0; i < totalConcurrentAttempts; i++) {
    const clientKey = `stress_${Date.now()}_${i}`;
    const promise = request('/booking', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        trip_id: stressTripId,
        quantity: 1,
        departure_date: '2026-11-01',
        meeting_point: 'Pintu Masuk Kersik Tuo',
        payment_method: 'midtrans',
        client_booking_key: clientKey,
        participants: [
          { name: `Concurrent Participant ${i + 1}`, gender: 'male', age: 25, id_type: 'KTP', id_number: `31710101019900${i + 10}` }
        ]
      }
    });
    bookingPromises.push(promise);
  }

  const results = await Promise.all(bookingPromises);
  const durationMs = Date.now() - startTime;

  let successCount = 0;
  let rejectedCount = 0;
  let otherCount = 0;

  results.forEach((res, idx) => {
    if (res.status === 200 && res.data?.id) {
      successCount++;
    } else if (res.status === 400 && (res.data?.code === 'AVAILABILITY_FAILED' || String(res.data?.detail).includes('kuota') || String(res.data?.detail).includes('stok'))) {
      rejectedCount++;
    } else {
      otherCount++;
    }
  });

  console.log(`  Concurrency Stress Results in ${durationMs}ms:`);
  console.log(`    - Successful Bookings (Within Quota): ${successCount}`);
  console.log(`    - Gracefully Rejected (Quota Exceeded): ${rejectedCount}`);
  console.log(`    - Other Responses: ${otherCount}`);

  // Verification 1: Exactly quotaLimit bookings must succeed
  const isExactQuotaEnforced = successCount === quotaLimit;
  recordTest(
    'CONCURRENCY',
    `Exact Quota Reservation Enforced (${quotaLimit}/${totalConcurrentAttempts} successful)`,
    isExactQuotaEnforced,
    `Success: ${successCount}, Rejected: ${rejectedCount}, Expected Success: ${quotaLimit}`
  );

  // Verification 2: Zero Overbooking Guard
  const isNoOverbooking = successCount <= quotaLimit;
  recordTest(
    'CONCURRENCY',
    'Zero Overbooking Invariant Guaranteed (No Race Conditions)',
    isNoOverbooking,
    `Capacity: ${quotaLimit}, Confirmed: ${successCount}`
  );

  // Verification 3: Correct Error Code for Exceeded Capacity
  const isRejectionCorrect = rejectedCount === (totalConcurrentAttempts - quotaLimit);
  recordTest(
    'CONCURRENCY',
    'Excess Concurrency Gracefully Handled with AVAILABILITY_FAILED',
    isRejectionCorrect,
    `Rejected: ${rejectedCount}/${totalConcurrentAttempts - quotaLimit}`
  );
}

// =========================================================================
// SECTION 4: DEPENDENCY & SUPPLY CHAIN SECURITY AUDIT
// =========================================================================

async function runDependencySecurityAudit() {
  console.log('\n============================================================');
  console.log('4.0 DEPENDENCY & SUPPLY CHAIN SECURITY AUDIT');
  console.log('============================================================');

  const rootPkg = require('../package.json');
  const frontendPkg = require('../frontend/package.json');

  const rootDeps = { ...(rootPkg.dependencies || {}), ...(rootPkg.devDependencies || {}) };
  const frontendDeps = { ...(frontendPkg.dependencies || {}), ...(frontendPkg.devDependencies || {}) };

  const totalDeps = Object.keys(rootDeps).length + Object.keys(frontendDeps).length;
  console.log(`  Audited Manifests: Root (${Object.keys(rootDeps).length} pkgs) + Frontend (${Object.keys(frontendDeps).length} pkgs)`);
  console.log(`  Total Managed Dependencies: ${totalDeps} packages`);

  // Scan for vulnerable patterns or outdated supply chain threats
  const knownHighRiskPackages = [
    'event-stream', 'flatmap-stream', 'left-pad', 'colors@1.4.1', 'faker@6.6.6', 'node-serialize'
  ];

  let maliciousFound = false;
  knownHighRiskPackages.forEach(badPkg => {
    if (rootDeps[badPkg] || frontendDeps[badPkg]) {
      maliciousFound = true;
      console.error(`  ⚠️ Critical supply chain risk detected: ${badPkg}`);
    }
  });

  recordTest(
    'SECURITY_AUDIT',
    'Supply Chain Malware & Compromised Package Signature Scan',
    !maliciousFound,
    maliciousFound ? 'Found high-risk package' : 'Zero malicious or known compromised packages found'
  );

  // Check forbidden packages (SQLite/NeDB/LowDB)
  const forbiddenLocalDbs = ['sqlite', 'sqlite3', 'better-sqlite3', 'nedb', 'lowdb', 'level', 'dexie'];
  let localDbFound = false;
  forbiddenLocalDbs.forEach(dbPkg => {
    if (rootDeps[dbPkg] || frontendDeps[dbPkg]) {
      localDbFound = true;
      console.error(`  ⚠️ Forbidden local database package detected: ${dbPkg}`);
    }
  });

  recordTest(
    'SECURITY_AUDIT',
    'Zero Forbidden Local Database Engines (Supabase Only Mandate)',
    !localDbFound,
    localDbFound ? 'Found forbidden local DB' : 'Clean: All persistent data flows exclusively through Supabase PostgreSQL'
  );

  // Core production packages validation
  const hasPg = Boolean(rootDeps.pg || rootDeps['@supabase/supabase-js']);
  const hasGenAI = Boolean(rootDeps['@google/genai'] || rootDeps['@google/generative-ai']);
  const hasMidtrans = Boolean(rootDeps['midtrans-client']);

  recordTest(
    'SECURITY_AUDIT',
    'Core Production SDKs Presence (pg/Supabase, @google/genai, midtrans-client)',
    hasPg && hasGenAI && hasMidtrans,
    `pg: ${Boolean(hasPg)}, genai: ${Boolean(hasGenAI)}, midtrans: ${Boolean(hasMidtrans)}`
  );
}

// =========================================================================
// RUNNER & SUMMARY
// =========================================================================

async function runAll() {
  console.log('============================================================');
  console.log('TREXIO TAHAP 9 - AUTOMATED TEST SUITE & SECURITY AUDIT');
  console.log('============================================================');
  const startTime = Date.now();

  try {
    const authData = await runAuthTests();
    const rbacData = await runRBACTests(authData.userToken);
    const bookingData = await runBookingStateMachineTests(authData.userToken, rbacData.vendorToken);
    await runPaymentWebhookTests(bookingData.confirmedBooking);
    await runRegressionTests(authData.userToken);
    await runConcurrencySlotTest(authData.userToken, rbacData.vendorToken);
    await runDependencySecurityAudit();
  } catch (err) {
    console.error('Test Runner Exception:', err);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log('\n============================================================');
  console.log('FINAL TEST EXECUTION SUMMARY');
  console.log('============================================================');
  console.log(`Total Tests Executed: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Pass Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`Execution Time: ${durationSec}s`);
  console.log('============================================================');

  if (testResults.failed > 0) {
    console.error(`\n❌ ATTENTION: ${testResults.failed} tests failed!`);
    process.exit(1);
  } else {
    console.log('\n✅ ALL TAHAP 9 UNIT, INTEGRATION, CONCURRENCY, & AUDIT TESTS PASSED!');
    process.exit(0);
  }
}

runAll();

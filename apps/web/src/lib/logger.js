/**
 * Trexio Centralized Frontend Audit & Diagnostics Logger
 * Traces full booking request lifecycle safely without exposing sensitive data (JWT, password, secrets, API keys).
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'access_token',
  'secret',
  'jwt',
  'authorization',
  'card_number',
  'cvv',
  'midtrans_server_key',
  'server_key'
]);

function sanitizeData(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeData);

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export function generateRequestId() {
  return `req_fe_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export const logger = {
  info(step, details = {}) {
    console.log(`[TREXIO_TRACE_FE][INFO] Step: ${step}`, sanitizeData(details));
  },
  warn(step, details = {}) {
    console.warn(`[TREXIO_TRACE_FE][WARN] Step: ${step}`, sanitizeData(details));
  },
  error(step, details = {}) {
    console.error(`[TREXIO_TRACE_FE][ERROR] Step: ${step}`, sanitizeData(details));
  },
  traceBooking(stepName, { requestId, category, productId, totalAmount, userId, endpoint, httpStatus, response, error }) {
    const payload = sanitizeData({
      requestId: requestId || generateRequestId(),
      step: stepName,
      timestamp: new Date().toISOString(),
      category: category || 'unknown',
      productId: productId || null,
      totalAmount: totalAmount || null,
      userId: userId || 'anonymous',
      endpoint: endpoint || null,
      httpStatus: httpStatus || null,
      response: response || null,
      error: error ? (error.message || error) : null
    });

    if (error) {
      console.error(`[BOOKING_LIFECYCLE_FE] ❌ [${stepName}]`, payload);
    } else {
      console.log(`[BOOKING_LIFECYCLE_FE] ✓ [${stepName}]`, payload);
    }
    return payload.requestId;
  }
};

export default logger;

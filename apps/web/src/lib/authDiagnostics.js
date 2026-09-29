import { api } from "./api";

/**
 * Diagnostic utility to verify JWT structure, database connection status,
 * and log the full authentication handshake for frontend/backend troubleshooting.
 */
export async function runAuthDiagnostics() {
  const logGroup = "🔑 [Auth Diagnostics Handshake]";
  console.group(logGroup);
  console.log("Timestamp:", new Date().toISOString());

  const clientToken = typeof window !== "undefined" ? localStorage.getItem("trexio-token") : null;
  console.log("Client LocalStorage Token:", clientToken ? `${clientToken.substring(0, 20)}...` : "None");

  const report = {
    clientTimestamp: new Date().toISOString(),
    hasLocalStorageToken: Boolean(clientToken),
    backendStatus: null,
    backendDiagnostics: null,
    currentUser: null,
    handshakeSuccess: false,
    errors: [],
  };

  try {
    // 1. Verify backend status endpoint
    console.log("Step 1: Checking /api/auth/status...");
    const statusRes = await api.get("/auth/status");
    report.backendStatus = statusRes.data;
    console.log("✓ Backend status response:", statusRes.data);
  } catch (err) {
    const errDetail = err.response?.data || err.message;
    report.errors.push(`Step 1 (Status) Failed: ${JSON.stringify(errDetail)}`);
    console.warn("❌ Backend status check failed:", errDetail);
  }

  try {
    // 2. Fetch backend diagnostics (JWT verification & DB connection health)
    console.log("Step 2: Requesting backend diagnostics from /api/auth/diagnostics...");
    const diagRes = await api.get("/auth/diagnostics");
    report.backendDiagnostics = diagRes.data;
    console.log("✓ Backend diagnostics response:", diagRes.data);
  } catch (err) {
    const errDetail = err.response?.data || err.message;
    report.errors.push(`Step 2 (Diagnostics) Failed: ${JSON.stringify(errDetail)}`);
    console.warn("❌ Backend diagnostics check failed:", errDetail);
  }

  try {
    // 3. Verify authenticated user profile via /api/auth/me
    console.log("Step 3: Validating user profile via /api/auth/me...");
    const meRes = await api.get("/auth/me");
    report.currentUser = meRes.data;
    report.handshakeSuccess = true;
    console.log("✓ User profile validated successfully:", meRes.data);
  } catch (err) {
    const errDetail = err.response?.data || err.message;
    report.errors.push(`Step 3 (User Profile) Failed: ${JSON.stringify(errDetail)}`);
    console.warn("⚠️ Current user validation failed (unauthenticated or invalid session):", errDetail);
  }

  console.log("Diagnostic Summary Report:", report);
  console.groupEnd();

  return report;
}

if (typeof window !== "undefined") {
  window.__trexioAuthDiagnostics = runAuthDiagnostics;
}

import { api } from "@/lib/api";

/**
 * Production Audit Utility
 * Verifies all user records, QR scan logs, and transaction histories are initialized with empty collections
 * rather than null or mock/dummy values. Displays a warning in the dev console if any legacy dummy records are detected.
 */
export async function runProductionAudit() {
  try {
    const res = await api.get("/production-audit");
    const data = res.data;

    if (data && data.dummy_records_found > 0) {
      console.warn(
        `[TREXIO PRODUCTION AUDIT WARNING] Detected ${data.dummy_records_found} legacy dummy or uninitialized records across ${data.users_audited} users. Records have been sanitized:`,
        data.warnings
      );
    } else {
      console.info(
        `[TREXIO PRODUCTION AUDIT PASSED] Verified ${data?.users_audited || 0} user records cleanly initialized with empty/real data collections.`
      );
    }
    return data;
  } catch (err) {
    console.warn("[TREXIO PRODUCTION AUDIT] Audit endpoint check notice:", err?.message || err);
    return null;
  }
}

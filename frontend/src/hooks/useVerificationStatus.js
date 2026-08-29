import { useAuth } from "@/context/AuthContext";

/**
 * Custom React hook 'useVerificationStatus'
 * Checks the current user's profile state or a provided target object
 * and returns status details including boolean 'isVerified' for simple UI-level conditional rendering.
 *
 * @param {Object} [userOverride] Optional target user or vendor/tenant object to check
 * @returns {Object} Verification status information
 */
export function useVerificationStatus(userOverride) {
  const { user: authUser, ready } = useAuth() || {};
  const targetUser = userOverride !== undefined ? userOverride : authUser;

  if (!targetUser) {
    return {
      isVerified: false,
      isPending: false,
      isUnverified: true,
      isRejected: false,
      status: "unverified",
      statusLabel: "Belum Diverifikasi",
      user: null,
      ready: ready ?? true,
    };
  }

  // Super Admins are inherently verified
  const isSuperAdmin =
    targetUser.role === "super_admin" ||
    (Array.isArray(targetUser.roles) && targetUser.roles.includes("super_admin"));

  // Check explicit properties across User, Vendor, and Tenant schemas
  const rawStatus =
    targetUser.verificationStatus ||
    targetUser.verification_status ||
    targetUser.vendor_status ||
    targetUser.status;

  const rawVerified =
    targetUser.verified === true ||
    targetUser.vendor_verified === true ||
    isSuperAdmin;

  let status = "unverified";
  if (isSuperAdmin || rawVerified || rawStatus === "verified") {
    status = "verified";
  } else if (rawStatus === "pending_verification" || rawStatus === "pending") {
    status = "pending_verification";
  } else if (rawStatus === "rejected") {
    status = "rejected";
  } else if (rawStatus === "active") {
    // If active user/vendor with no explicit pending/unverified marker
    status = targetUser.vendor_verified === false ? "unverified" : "verified";
  } else if (typeof rawStatus === "string") {
    status = rawStatus;
  }

  const isVerified = status === "verified" || rawVerified;
  const isPending = status === "pending_verification" || status === "pending";
  const isRejected = status === "rejected";
  const isUnverified = !isVerified && !isPending;

  let statusLabel = "Belum Diverifikasi";
  if (isVerified) {
    statusLabel = "Terverifikasi";
  } else if (isPending) {
    statusLabel = "Menunggu Verifikasi";
  } else if (isRejected) {
    statusLabel = "Ditolak";
  }

  return {
    isVerified,
    isPending,
    isUnverified,
    isRejected,
    status,
    statusLabel,
    user: targetUser,
    ready: ready ?? true,
  };
}

export default useVerificationStatus;

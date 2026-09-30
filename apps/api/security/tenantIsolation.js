'use strict';

/**
 * Central tenant isolation decision logic.
 *
 * This module is intentionally framework-agnostic so the authorization
 * invariant can be unit-tested without booting the HTTP server.
 */

const GLOBAL_ROLES = new Set(['super_admin', 'admin']);

function resolveTenantForRequest({
  requestedTenantId,
  requestedTenantSlug,
  user,
  tenants,
  defaultTenant,
}) {
  const list = Array.isArray(tenants) ? tenants : [];
  let tenant = null;

  if (requestedTenantId) {
    tenant = list.find((item) => item.id === String(requestedTenantId)) || null;
  }

  if (!tenant && requestedTenantSlug) {
    const slug = String(requestedTenantSlug).toLowerCase();
    tenant = list.find((item) => String(item.slug || '').toLowerCase() === slug) || null;
  }

  if (!tenant && user?.tenant_id) {
    tenant =
      list.find(
        (item) => item.id === user.tenant_id || item.owner_user_id === user.id
      ) || null;
  }

  return tenant || defaultTenant || null;
}

function assertTenantAccess({ user, userRoles, targetTenant }) {
  if (!user || !targetTenant) {
    return { allowed: false, reason: 'missing_context' };
  }

  const roles = Array.isArray(userRoles) ? userRoles : [];
  if (roles.some((role) => GLOBAL_ROLES.has(role))) {
    return { allowed: true, reason: 'global_role' };
  }

  const isOwner = targetTenant.owner_user_id === user.id;
  const isAssigned = Boolean(user.tenant_id && targetTenant.id === user.tenant_id);

  if (isOwner || isAssigned) {
    return { allowed: true, reason: isOwner ? 'tenant_owner' : 'tenant_assignment' };
  }

  return { allowed: false, reason: 'cross_tenant_access' };
}

module.exports = {
  GLOBAL_ROLES,
  resolveTenantForRequest,
  assertTenantAccess,
};

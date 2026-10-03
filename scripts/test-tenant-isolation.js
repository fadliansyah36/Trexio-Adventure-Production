'use strict';

const assert = require('assert');
const {
  resolveTenantForRequest,
  assertTenantAccess,
} = require('../apps/api/security/tenantIsolation');

const tenants = [
  { id: 'tenant_a', slug: 'alpha', owner_user_id: 'owner_a' },
  { id: 'tenant_b', slug: 'beta', owner_user_id: 'owner_b' },
  { id: 'tenant_default', slug: 'default', owner_user_id: 'owner_default' },
];
const defaultTenant = tenants[2];

function decision(user, roles, requestedTenantId) {
  const target = resolveTenantForRequest({
    requestedTenantId,
    user,
    tenants,
    defaultTenant,
  });
  return { target, access: assertTenantAccess({ user, userRoles: roles, targetTenant: target }) };
}

// Tenant A may access A.
{
  const { target, access } = decision({ id: 'user_a', tenant_id: 'tenant_a' }, ['tenant_admin'], 'tenant_a');
  assert.strictEqual(target?.id, 'tenant_a');
  assert.strictEqual(access.allowed, true);
}

// Tenant A must not access B even when B is supplied by client input.
{
  const { target, access } = decision({ id: 'user_a', tenant_id: 'tenant_a' }, ['tenant_admin'], 'tenant_b');
  assert.strictEqual(target?.id, 'tenant_b');
  assert.strictEqual(access.allowed, false);
  assert.strictEqual(access.reason, 'cross_tenant_access');
}

// Owner access is valid even when tenant_id is not populated yet.
{
  const { target, access } = decision({ id: 'owner_b', tenant_id: null }, ['tenant_owner'], 'tenant_b');
  assert.strictEqual(target.id, 'tenant_b');
  assert.strictEqual(access.allowed, true);
  assert.strictEqual(access.reason, 'tenant_owner');
}

// Super Admin / platform Admin remain globally scoped.
for (const role of ['super_admin', 'admin']) {
  const { access } = decision({ id: 'platform', tenant_id: 'tenant_a' }, [role], 'tenant_b');
  assert.strictEqual(access.allowed, true);
  assert.strictEqual(access.reason, 'global_role');
}

// A tenant-scoped user with no tenant must fail closed; the default tenant is never implicit.
{
  const { target, access } = decision({ id: 'orphan_user', tenant_id: null }, ['tenant_user'], null);
  assert.strictEqual(target, null);
  assert.strictEqual(access.allowed, false);
  assert.strictEqual(access.reason, 'missing_context');
}

// Missing/unknown tenant input resolves only to the authenticated user's tenant.
{
  const { target, access } = decision({ id: 'user_a', tenant_id: 'tenant_a' }, ['tenant_user'], 'does-not-exist');
  assert.strictEqual(target.id, 'tenant_a');
  assert.strictEqual(access.allowed, true);
}

console.log('[10C] Tenant isolation authorization unit tests: PASS');

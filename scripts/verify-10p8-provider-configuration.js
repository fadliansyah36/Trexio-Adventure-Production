#!/usr/bin/env node
/**
 * 10P.8 — Fail-Closed Provider Configuration Gate
 *
 * Verifies:
 * 1. Required production providers cannot start without configuration.
 * 2. Partial Midtrans credentials are rejected.
 * 3. Optional Gemini is accurately reported as unavailable when absent.
 * 4. Production authentication cannot fall back to local bcrypt.
 * 5. API startup invokes the centralized provider configuration gate.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const providerConfigPath = path.join(ROOT, 'apps/api/config/providerConfig.js');
const authRoutesPath = path.join(ROOT, 'apps/api/modules/routes/authRoutes.js');
const serverPath = path.join(ROOT, 'apps/api/server.js');

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

assert(fs.existsSync(providerConfigPath), 'providerConfig.js is missing');
assert(fs.existsSync(authRoutesPath), 'authRoutes.js is missing');
assert(fs.existsSync(serverPath), 'server.js is missing');

if (fs.existsSync(providerConfigPath)) {
  const providerConfig = require(providerConfigPath);

  const missingProduction = spawnSync(process.execPath, [
    '-e',
    "const c=require('./apps/api/config/providerConfig'); c.assertProductionConfiguration();"
  ], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: '',
      JWT_SECRET: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_ANON_KEY: '',
      MIDTRANS_SERVER_KEY: '',
      MIDTRANS_CLIENT_KEY: '',
      GEMINI_API_KEY: '',
    },
    encoding: 'utf8',
  });

  assert(
    missingProduction.status !== 0,
    'Production configuration unexpectedly passes with required provider credentials missing'
  );
  assert(
    /PROVIDER_CONFIGURATION_REQUIRED|Production provider configuration is incomplete/.test(
      (missingProduction.stderr || '') + (missingProduction.stdout || '')
    ),
    'Missing production configuration did not expose an explicit provider configuration error'
  );

  const partialMidtrans = spawnSync(process.execPath, [
    '-e',
    "const c=require('./apps/api/config/providerConfig'); c.assertProductionConfiguration();"
  ], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://db.supabase.co/example',
      JWT_SECRET: 'x'.repeat(32),
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      SUPABASE_ANON_KEY: 'anon-key',
      MIDTRANS_SERVER_KEY: 'configured-server-key',
      MIDTRANS_CLIENT_KEY: '',
      GEMINI_API_KEY: '',
    },
    encoding: 'utf8',
  });

  assert(
    partialMidtrans.status !== 0,
    'Partial Midtrans credentials unexpectedly pass production provider validation'
  );

  const development = spawnSync(process.execPath, [
    '-e',
    "const c=require('./apps/api/config/providerConfig'); const r=c.assertProductionConfiguration(); if(r.mode!=='development') process.exit(1);"
  ], {
    cwd: ROOT,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DATABASE_URL: '',
      JWT_SECRET: '',
      SUPABASE_URL: '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      SUPABASE_ANON_KEY: '',
      MIDTRANS_SERVER_KEY: '',
      MIDTRANS_CLIENT_KEY: '',
      GEMINI_API_KEY: '',
    },
    encoding: 'utf8',
  });

  assert(development.status === 0, 'Development mode was incorrectly blocked by the production provider gate');

  const optionalState = providerConfig.getProviderStatus();
  assert(optionalState.gemini.configured === false, 'Gemini is reported configured without GEMINI_API_KEY');
  assert(optionalState.midtrans.configured === false, 'Midtrans is reported configured without both credentials');
}

const authSource = fs.readFileSync(authRoutesPath, 'utf8');
const serverSource = fs.readFileSync(serverPath, 'utf8');

assert(
  authSource.includes("process.env.NODE_ENV === 'production' && !supabaseAuth.supabaseAuthEnabled"),
  'Production auth guard is missing'
);
assert(
  !authSource.includes("if (!isValid && user.password_hash) {"),
  'Production login still has an unconditional local bcrypt fallback'
);
assert(
  authSource.includes("if (!isValid && user.password_hash && process.env.NODE_ENV !== 'production')"),
  'Local bcrypt compatibility path is not explicitly development-only'
);
assert(
  serverSource.includes('providerConfig.assertProductionConfiguration();'),
  'API startup does not invoke the centralized production provider gate'
);

const partnerAuthGuardCount = (serverSource.match(/process\.env\.NODE_ENV === 'production' && !supabaseAuth\.supabaseAuthEnabled/g) || []).length;
assert(
  partnerAuthGuardCount >= 3 && authSource.includes("process.env.NODE_ENV === 'production' && !supabaseAuth.supabaseAuthEnabled"),
  'Production auth guards are incomplete: main auth plus partner registration/login must fail closed'
);
assert(
  serverSource.includes('providerConfig.getProviderStatus().gemini.configured'),
  'LLM health is not sourced from the centralized Gemini provider configuration'
);
assert(
  !serverSource.includes('Boolean(process.env.GEMINI_API_KEY || process.env.API_KEY)'),
  'LLM health still treats the generic API_KEY as a Gemini credential'
);

const status = failures.length ? 'BLOCKED' : 'PASS';
const report = {
  stage: '10P.8',
  status,
  checks: 8,
  findings: failures,
  policy: 'Required production providers fail closed; optional providers never report operational without valid configuration.',
};

console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);

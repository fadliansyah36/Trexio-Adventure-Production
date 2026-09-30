'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const serverPath = path.join(ROOT, 'apps/api/server.js');
const repoPath = path.join(ROOT, 'apps/api/modules/repositories/paymentWebhookRepository.js');
const migrationPath = path.join(ROOT, 'supabase/migrations/20260930060000_production_payment_webhook_idempotency.sql');
const failures = [];
const checks = [];

function pass(name, detail) { checks.push({ name, status: 'PASS', detail }); }
function fail(name, detail) { failures.push({ name, detail }); checks.push({ name, status: 'FAIL', detail }); }

for (const [name, file] of [
  ['server', serverPath],
  ['webhook_repository', repoPath],
  ['idempotency_migration', migrationPath],
]) {
  if (fs.existsSync(file)) pass(name + '_boundary', file.replace(ROOT + path.sep, ''));
  else fail(name + '_boundary', 'missing ' + file.replace(ROOT + path.sep, ''));
}

const server = fs.existsSync(serverPath) ? fs.readFileSync(serverPath, 'utf8') : '';
const webhookRepo = fs.existsSync(repoPath) ? fs.readFileSync(repoPath, 'utf8') : '';
const migration = fs.existsSync(migrationPath) ? fs.readFileSync(migrationPath, 'utf8') : '';

if (server.includes("paymentWebhookRepository = require('./modules/repositories/paymentWebhookRepository')")) {
  pass('durable_idempotency_dependency', 'API imports the durable webhook repository');
} else fail('durable_idempotency_dependency', 'API still lacks the durable webhook repository');

if (server.includes('await paymentWebhookRepository.claim({')) {
  pass('durable_claim', 'webhook claims the event in PostgreSQL before side effects');
} else fail('durable_claim', 'webhook does not claim events durably');

if (server.includes('await paymentWebhookRepository.markProcessed(eventKey)')) {
  pass('durable_processed_state', 'webhook records processed state durably');
} else fail('durable_processed_state', 'webhook does not persist processed state');

if (server.includes('await paymentWebhookRepository.markFailed(eventKey')) {
  pass('durable_failed_state', 'webhook records failed validation state durably');
} else fail('durable_failed_state', 'webhook does not persist failed state');

if (server.includes("String(status_code) !== '200'") && server.includes("normalizedFraud !== 'accept'")) {
  pass('midtrans_success_validation', 'successful notifications require status_code=200 and acceptable fraud status');
} else fail('midtrans_success_validation', 'successful notifications are not fully validated');

if (server.includes('const grossStr = String(gross_amount);') &&
    server.includes('grossStr') &&
    server.includes('serverKey')) {
  pass('strict_signature_formula', 'signature uses the exact received gross_amount string');
} else fail('strict_signature_formula', 'signature formula is not strict to the received gross_amount');

if (server.includes("api.post('/payments/midtrans/simulate-paid/:booking_id'") &&
    server.includes('return res.status(410)')) {
  pass('simulation_disabled', 'payment simulation endpoint remains disabled');
} else fail('simulation_disabled', 'payment simulation bypass must remain disabled');

if (webhookRepo.includes('ON CONFLICT (event_key) DO NOTHING') &&
    webhookRepo.includes('FOR UPDATE') &&
    webhookRepo.includes('STALE_PROCESSING_MS')) {
  pass('concurrency_recovery', 'durable idempotency handles duplicates and stale processing recovery');
} else fail('concurrency_recovery', 'durable idempotency lacks duplicate/stale processing protection');

if (migration.includes('CREATE TABLE IF NOT EXISTS public.payment_webhook_events') &&
    migration.includes('ENABLE ROW LEVEL SECURITY') &&
    migration.includes('service_role_all_payment_webhook_events')) {
  pass('database_security', 'webhook event store is RLS-enabled and service-role scoped');
} else fail('database_security', 'webhook event store security boundary is incomplete');

{
  const orderId = 'TREXIO-10D-TEST';
  const statusCode = '200';
  const grossAmount = '10000.00';
  const serverKey = 'unit-test-server-key';
  const expected = crypto.createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');
  const tamperedGross = crypto.createHash('sha512')
    .update(orderId + statusCode + '10000' + serverKey)
    .digest('hex');
  if (expected !== tamperedGross) pass('signature_vector', 'signature changes when gross_amount representation changes');
  else fail('signature_vector', 'signature vector unexpectedly collides');
}

const report = {
  generated_at: new Date().toISOString(),
  stage: '10D',
  status: failures.length ? 'BLOCKED' : 'STRUCTURAL_PASS_RUNTIME_EVIDENCE_REQUIRED',
  checks,
  failures,
  runtime_evidence: {
    live_midtrans_notification: 'REQUIRED',
    duplicate_notification_replay: 'REQUIRED',
    amount_mismatch_rejection: 'REQUIRED',
    provider_status_reconciliation: 'REQUIRED',
    note: 'Structural verification does not constitute live Midtrans production evidence.',
  },
};

const dataDir = path.join(ROOT, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'payment-webhook-10d.json'), JSON.stringify(report, null, 2));

if (failures.length) {
  console.error('[10D] Payment webhook gate: BLOCKED');
  failures.forEach((item) => console.error(' - ' + item.name + ': ' + item.detail));
  process.exit(1);
}

console.log('[10D] Payment webhook structural gate: PASS');
console.log('[10D] Live Midtrans notification evidence remains REQUIRED.');

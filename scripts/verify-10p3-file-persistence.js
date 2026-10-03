#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const aiDir = path.join(root, 'apps/api/modules/ai/services');
const targetServices = [
  'ai-adventure-intelligence.service.js',
  'ai-evaluation.service.js',
  'ai-event.service.js',
  'ai-feature-flags.service.js',
  'ai-homepage-ranking.service.js',
  'ai-recommendation-config.service.js',
  'ai-seo.service.js',
  'ai-smart-search.service.js',
  'ai-usage.service.js',
];

const failures = [];
const forbidden = /(?:require\(['"]fs['"]\)|require\(['"]path['"]\)|\bfs\.(?:readFileSync|writeFileSync|existsSync|mkdirSync|appendFileSync|unlinkSync)\b|\b(?:readFileSync|writeFileSync|existsSync|mkdirSync)\b|\bDATA_DIR\b|\b[A-Z_]+_FILE\b|loadFromDisk|saveToDisk|loadAllFromDisk)/;

for (const name of targetServices) {
  const file = path.join(aiDir, name);
  if (!fs.existsSync(file)) {
    failures.push(`missing AI service: ${name}`);
    continue;
  }
  const source = fs.readFileSync(file, 'utf8');
  if (forbidden.test(source)) failures.push(`file persistence remains in ${name}`);
  if (!/aiPostgresPersistence/.test(source)) failures.push(`PostgreSQL persistence adapter missing in ${name}`);
}

const migration = path.join(root, 'supabase/migrations/20261001220000_10p3_ai_file_persistence_cutover.sql');
if (!fs.existsSync(migration)) failures.push('10P.3 migration missing');

const expectedTables = [
  'ai_trail_statuses','ai_official_alerts','ai_user_checklists','ai_safety_config',
  'ai_golden_dataset','ai_traces','ai_user_feedback','ai_alerts','ai_regression_reports',
  'ai_event_logs','ai_feature_flags','ai_homepage_ranking_config','ai_recommendation_config',
  'ai_articles','ai_seo_config','ai_news_sources','ai_search_config','ai_usage_logs'
];
if (fs.existsSync(migration)) {
  const sql = fs.readFileSync(migration, 'utf8');
  for (const table of expectedTables) {
    if (!sql.includes(`public.${table}`)) failures.push(`missing migration table: ${table}`);
    if (!sql.includes(`public.${table} ENABLE ROW LEVEL SECURITY`)) failures.push(`RLS not enabled in migration: ${table}`);
  }
}

if (failures.length) {
  console.error('10P.3 BLOCKED');
  failures.forEach((x) => console.error(' - ' + x));
  process.exit(1);
}
console.log(JSON.stringify({
  status: 'PASS',
  stage: '10P.3',
  scope: 'AI runtime file/JSON persistence',
  services: targetServices.length,
  postgres_collections: expectedTables.length
}, null, 2));

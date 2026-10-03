'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_ROOTS = ['apps/api', 'apps/web', 'apps/admin', 'frontend', 'src', 'server.js'];
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const EXCLUDED = new Set(['node_modules', '.git', 'build', 'dist', '.next', 'coverage']);
const inventory = {
  generated_at: new Date().toISOString(),
  stage: '10P.1',
  objective: 'Full Runtime Inventory',
  policy: {
    source_of_truth: 'Supabase PostgreSQL',
    business_state: 'persistent database-backed repositories/services',
    forbidden_runtime_business_state: [
      'in-memory arrays/objects',
      'localStorage/sessionStorage',
      'JSON/file persistence',
      'hardcoded business records',
      'mock/fake/demo/scenario/simulation data',
      'silent provider fallbacks'
    ]
  },
  files: [],
  findings: [],
  architecture_edges: [],
  route_inventory: [],
  repository_inventory: [],
  summary: {}
};

function rel(file) { return path.relative(ROOT, file).replaceAll(path.sep, '/'); }
function addFinding(file, line, category, evidence, severity='HIGH') {
  inventory.findings.push({ file: rel(file), line, category, severity, evidence: evidence.trim().slice(0, 500) });
}
function addEdge(from, to, type) {
  inventory.architecture_edges.push({ from, to, type });
}
function scanFile(file) {
  const extension = path.extname(file);
  if (!EXTENSIONS.has(extension)) return;
  const relative = rel(file);
  const text = fs.readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  inventory.files.push({
    path: relative,
    extension,
    bytes: Buffer.byteLength(text),
    line_count: lines.length,
    layer: relative.startsWith('apps/api/') ? 'api' :
      relative.startsWith('apps/web/') ? 'web' :
      relative.startsWith('apps/admin/') ? 'admin' :
      relative.startsWith('src/') ? 'legacy-src' : 'root'
  });

  lines.forEach((raw, index) => {
    const line = index + 1;
    const s = raw.trim();
    if (/\b(writeFileSync|appendFileSync|createWriteStream)\s*\(/.test(s))
      addFinding(file, line, 'FILE_WRITE_RUNTIME', s);
    if (/\b(readFileSync)\s*\(/.test(s) && !/package|config|schema|migration|report/i.test(s))
      addFinding(file, line, 'FILE_READ_RUNTIME', s);
    if (/\b(localStorage|sessionStorage)\s*\./.test(s))
      addFinding(file, line, 'BROWSER_STORAGE', s);
    if (/\b(saveCollection|loadCollection|save.*ToDisk|load.*FromDisk)\s*\(/i.test(s))
      addFinding(file, line, 'FILE_OR_COLLECTION_PERSISTENCE', s);
    if (/\b(mock|dummy|fake|placeholder|simulation|simulate|scenario|demo)\b/i.test(s))
      addFinding(file, line, 'MOCK_SIMULATION_REFERENCE', s, 'MEDIUM');
    if (/example-vapid-key|example\.com|admin@trexio\.id/.test(s))
      addFinding(file, line, 'PLACEHOLDER_DEFAULT_IDENTITY', s);
    if (/\bconst\s+[A-Za-z][A-Za-z0-9_]*\s*=\s*\[\s*\{/.test(s))
      addFinding(file, line, 'STATIC_OBJECT_ARRAY', s);
    if (/\bconst\s+[A-Za-z][A-Za-z0-9_]*\s*=\s*\{/.test(s) &&
        /plan|tenant|booking|vendor|trip|rental|payment|subscription|campaign|community|destination|product/i.test(s))
      addFinding(file, line, 'STATIC_BUSINESS_OBJECT', s);
    if (/\b(inMemory|memoryStore|dataStore|store\s*=\s*\{|db\s*=\s*\{)/i.test(s))
      addFinding(file, line, 'IN_MEMORY_STORE_REFERENCE', s);
  });

  const routePatterns = [
    /\b(?:api|app|router)\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)/g,
    /\brouter\.(get|post|put|patch|delete)\(\s*['\"]([^'\"]+)/g
  ];
  for (const pattern of routePatterns) {
    let match;
    while ((match = pattern.exec(text))) {
      const line = text.slice(0, match.index).split(/\r?\n/).length;
      inventory.route_inventory.push({ file: relative, line, method: match[1].toUpperCase(), path: match[2] });
    }
  }

  if (/repository/i.test(path.basename(file)) || /modules\/persistence\//.test(relative)) {
    inventory.repository_inventory.push({ path: relative, likely_persistence_boundary: true });
  }

  const requirePattern = /require\(\s*['\"](\.[^'\"]+)['\"]\s*\)/g;
  let match;
  while ((match = requirePattern.exec(text))) {
    addEdge(relative, path.normalize(path.join(path.dirname(relative), match[1])).replaceAll(path.sep, '/'), 'relative-require');
  }
  const importPattern = /from\s+['\"](\.[^'\"]+)['\"]|import\s+['\"](\.[^'\"]+)['\"]/g;
  while ((match = importPattern.exec(text))) {
    const target = match[1] || match[2];
    addEdge(relative, path.normalize(path.join(path.dirname(relative), target)).replaceAll(path.sep, '/'), 'relative-import');
  }
}
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const stat = fs.statSync(dir);
  if (stat.isFile()) return scanFile(dir);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED.has(entry.name)) continue;
    walk(path.join(dir, entry.name));
  }
}
for (const root of SOURCE_ROOTS) walk(path.join(ROOT, root));

const counts = {};
for (const f of inventory.findings) counts[f.category] = (counts[f.category] || 0) + 1;
inventory.summary = {
  source_file_count: inventory.files.length,
  api_files: inventory.files.filter(f => f.layer === 'api').length,
  web_files: inventory.files.filter(f => f.layer === 'web').length,
  admin_files: inventory.files.filter(f => f.layer === 'admin').length,
  legacy_src_files: inventory.files.filter(f => f.layer === 'legacy-src').length,
  route_count: inventory.route_inventory.length,
  repository_boundary_count: inventory.repository_inventory.length,
  architecture_edge_count: inventory.architecture_edges.length,
  finding_count: inventory.findings.length,
  finding_counts: counts,
  high_severity_count: inventory.findings.filter(f => f.severity === 'HIGH').length,
  status: inventory.findings.some(f => f.severity === 'HIGH') ? 'BLOCKED_REMEDIATION_REQUIRED' : 'INVENTORY_COMPLETE'
};

const dataDir = path.join(ROOT, 'data');
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, '10p1-runtime-inventory.json'), JSON.stringify(inventory, null, 2));

const md = [
  '# Trexio Stage 10P.1 — Full Runtime Inventory',
  '',
  `Generated: ${inventory.generated_at}`,
  '',
  '## Status',
  '',
  `**${inventory.summary.status}**`,
  '',
  '## Runtime topology',
  '',
  `- Source files: ${inventory.summary.source_file_count}`,
  `- API: ${inventory.summary.api_files}`,
  `- Web: ${inventory.summary.web_files}`,
  `- Admin: ${inventory.summary.admin_files}`,
  `- Legacy src: ${inventory.summary.legacy_src_files}`,
  `- Routes discovered: ${inventory.summary.route_count}`,
  `- Repository/persistence boundaries: ${inventory.summary.repository_boundary_count}`,
  `- Relative architecture edges: ${inventory.summary.architecture_edge_count}`,
  '',
  '## Finding counts',
  '',
  ...Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v]) => `- ${k}: ${v}`),
  '',
  '## Remediation rule',
  '',
  'Business-critical runtime state must terminate at the PostgreSQL-backed repository/service boundary. Inventory findings are not automatically safe merely because the code path is currently empty or development-only; each production-reachable path must be explicitly classified and remediated.',
  '',
  '## Findings',
  '',
  ...inventory.findings.map(f => `- **[${f.severity}] ${f.category}** — ${f.file}:${f.line} — \`${f.evidence.replaceAll('\\n',' ')}\``)
].join('\n');
fs.writeFileSync(path.join(dataDir, '10p1-runtime-inventory.md'), md);

console.log(JSON.stringify(inventory.summary, null, 2));

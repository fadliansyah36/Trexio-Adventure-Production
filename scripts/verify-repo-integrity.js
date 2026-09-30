/**
 * TREXIO REPOSITORY INTEGRITY & ARCHITECTURE GATE
 * Enforces strict anti-mock, Supabase-only, and environment-driven integration rules.
 * Runs in CI/CD pipeline (GitHub Actions) and pre-push hooks.
 */

const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('TREXIO REPOSITORY INTEGRITY & ARCHITECTURE VERIFIER');
console.log('============================================================');

let violations = [];
let passedChecks = [];

// 1. FORBIDDEN LOCAL DATABASE ENGINES & PACKAGES
const forbiddenPackages = [
  'sqlite3',
  'better-sqlite3',
  'nedb',
  'lowdb',
  'leveldb',
  'pouchdb',
  'lokijs',
  'typeorm',
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/platform-express',
  '@nestjs/typeorm'
];

try {
  const pkgContent = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = {
    ...(pkgContent.dependencies || {}),
    ...(pkgContent.devDependencies || {})
  };

  const detectedForbiddenPackages = forbiddenPackages.filter(p => allDeps[p]);
  if (detectedForbiddenPackages.length > 0) {
    violations.push({
      category: 'DATABASE_RULE_VIOLATION',
      message: `Terdeteksi package database lokal terlarang di package.json: ${detectedForbiddenPackages.join(', ')}. Wajib hanya gunakan Supabase PostgreSQL.`
    });
  } else {
    passedChecks.push('No forbidden local database packages in package.json (SQLite/NeDB/LowDB check clean).');
  }

  // Ensure Supabase / Postgres dependency is present
  if (allDeps['@supabase/supabase-js'] || allDeps['pg'] || allDeps['drizzle-orm']) {
    passedChecks.push('Supabase / PostgreSQL connection driver confirmed in package.json.');
  } else {
    violations.push({
      category: 'DATABASE_RULE_VIOLATION',
      message: 'Supabase / PostgreSQL driver tidak ditemukan di package.json.'
    });
  }
} catch (e) {
  violations.push({
    category: 'PACKAGE_PARSE_ERROR',
    message: `Gagal membaca package.json: ${e.message}`
  });
}

// 2. SCAN SOURCE CODE FOR LOCAL DB STRINGS & MOCK DATABASE GENERATORS
const forbiddenCodePatterns = [
  { pattern: /require\(['"]sqlite3['"]\)/i, rule: 'SQLite driver import detected' },
  { pattern: /require\(['"]better-sqlite3['"]\)/i, rule: 'Better-SQLite3 driver import detected' },
  { pattern: /require\(['"]nedb['"]\)/i, rule: 'NeDB driver import detected' },
  { pattern: /require\(['"]lowdb['"]\)/i, rule: 'LowDB driver import detected' },
  { pattern: /new\s+SQLiteDatabase/i, rule: 'Direct SQLite instance creation detected' },
  { pattern: /sqlite:\/\//i, rule: 'SQLite connection URI detected in source' },
  { pattern: /DATABASE_FILE/i, rule: 'Local database file configuration detected' },
  { pattern: /trexio_database\.sqlite/i, rule: 'Legacy SQLite database filename detected' },
  { pattern: /from\s+['\"]@nestjs\//i, rule: 'Inactive NestJS backend import detected' },
  { pattern: /require\(['\"]@nestjs\//i, rule: 'Inactive NestJS backend import detected' },
  { pattern: /from\s+['\"]typeorm['\"]/i, rule: 'Inactive TypeORM import detected' },
  { pattern: /require\(['\"]typeorm['\"]/i, rule: 'Inactive TypeORM import detected' }
];

let scannedCount = 0;

function scanDirectoryForViolations(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', 'test_reports', '.emergent'].includes(entry.name)) continue;
      scanDirectoryForViolations(fullPath);
    } else if (entry.isFile()) {
      if (/\.(js|ts|jsx|tsx)$/.test(entry.name)) {
        scannedCount++;
        const content = fs.readFileSync(fullPath, 'utf8');

        forbiddenCodePatterns.forEach(({ pattern, rule }) => {
          if (pattern.test(content) && !fullPath.includes('verify-repo-integrity.js')) {
            violations.push({
              category: 'CODE_INTEGRITY_VIOLATION',
              file: fullPath,
              message: `Pola kode terlarang: ${rule}`
            });
          }
        });

        // Detect forbidden fake mock data generator files in production directories
        if (
          (entry.name.startsWith('mock-db') || entry.name.startsWith('fake-database')) &&
          !fullPath.includes('test')
        ) {
          violations.push({
            category: 'MOCK_DATA_RULE_VIOLATION',
            file: fullPath,
            message: 'File mock database dilarang di lingkungan produksi Trexio.'
          });
        }
      }
    }
  }
}

scanDirectoryForViolations('apps/api');
scanDirectoryForViolations('apps/web');
scanDirectoryForViolations('apps/admin');
scanDirectoryForViolations('packages');
scanDirectoryForViolations('scripts');
if (fs.existsSync('server.js')) {
  scannedCount++;
  const serverContent = fs.readFileSync('server.js', 'utf8');
  forbiddenCodePatterns.forEach(({ pattern, rule }) => {
    if (pattern.test(serverContent)) {
      violations.push({
        category: 'CODE_INTEGRITY_VIOLATION',
        file: 'server.js',
        message: `Pola kode terlarang di server.js: ${rule}`
      });
    }
  });
}

passedChecks.push(`Scanned ${scannedCount} source files for unauthorized database engines and forbidden patterns.`);

// 3. VERIFY ENVIRONMENT BINDINGS (NO HARDCODED PRODUCTION SECRETS)
const envExamplePath = '.env.example';
if (fs.existsSync(envExamplePath)) {
  const envContent = fs.readFileSync(envExamplePath, 'utf8');
  const requiredEnvVars = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MIDTRANS_SERVER_KEY', 'GEMINI_API_KEY'];
  const missingEnvs = requiredEnvVars.filter(v => !envContent.includes(v));

  if (missingEnvs.length === 0) {
    passedChecks.push('All core production integration environment variables documented in .env.example.');
  } else {
    violations.push({
      category: 'ENV_INTEGRITY_VIOLATION',
      message: `Variabel environment berikut belum dideklarasikan di .env.example: ${missingEnvs.join(', ')}`
    });
  }
}

// 4. PRINT REPORT
console.log('\n--- PASSED INTEGRITY CHECKS ---');
passedChecks.forEach(c => console.log(`✓ ${c}`));

console.log('\n------------------------------------------------------------');
if (violations.length > 0) {
  console.error('INTEGRITY & ARCHITECTURE VIOLATIONS FOUND:');
  violations.forEach((v, idx) => {
    console.error(`[${idx + 1}] [${v.category}] ${v.file ? `${v.file}: ` : ''}${v.message}`);
  });
  console.error('\nSTATUS: ✗ FAILED (PULL / PUSH BLOCKED BY TREXIO GOVERNANCE)');
  console.error('Silakan perbaiki pelanggaran di atas sebelum melakukan commit/push ke GitHub.');
  process.exit(1);
} else {
  console.log('STATUS: ✓ ALL ARCHITECTURE & REPO INTEGRITY CHECKS PASSED');
  console.log('Repositori aktif melewati integrity checks untuk Supabase PostgreSQL, Midtrans, dan Google GenAI.');
  process.exit(0);
}

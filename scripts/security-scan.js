/**
 * Trexio SAST & Code Security Scanner
 * Performs static security scans across the active apps/, packages/, scripts/, and API compatibility entrypoint.
 */

const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('TREXIO AUTOMATED SAST & SECURITY SCANNER');
console.log('============================================================');

let totalFiles = 0;
let findings = {
  p0: [],
  p1: [],
  p2: [],
  p3: [],
  secrets: []
};

function scanFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  totalFiles++;

  // Secret Detection: Check for hardcoded private keys or tokens
  const secretPatterns = [
    /(?:api_key|secret_key|private_key|password|jwt_secret)\s*=\s*['"][A-Za-z0-9_\-]{20,}['"]/i,
    /-----BEGIN (?:RSA )?PRIVATE KEY-----/
  ];

  secretPatterns.forEach((pattern) => {
    if (pattern.test(content) && !filePath.includes('example') && !filePath.includes('config.json')) {
      findings.secrets.push({ file: filePath, rule: 'Hardcoded Secret Pattern' });
    }
  });

  // Detect embedded credential fallbacks and common secret material.
  const credentialFallbackPatterns = [
    /(?:jwt_secret|secret_key|api_key|private_key|password)\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i,
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  ];
  credentialFallbackPatterns.forEach((pattern) => {
    if (pattern.test(content) && !filePath.includes('security-scan.js') && !filePath.includes('.env.example')) {
      findings.secrets.push({ file: filePath, rule: 'Embedded credential or private-key material' });
    }
  });

  // Client-side logging must never dump Axios configs or request/response bodies.
  if (filePath.startsWith('frontend/') && /console\.error\([^\n]*(?:fullConfig|requestDTO|requestData|serverResponseBody)/i.test(content)) {
    findings.p1.push({ file: filePath, rule: 'Sensitive request configuration/body logged to browser console' });
  }

  // Check for unsafe SQL concatenation in server.js or src
  if (filePath.endsWith('.js') || filePath.endsWith('.ts')) {
    if (/SELECT .* FROM .* \+ /i.test(content) || /INSERT INTO .* VALUES \(.*\+/i.test(content)) {
      findings.p0.push({ file: filePath, rule: 'Unsafe SQL String Concatenation' });
    }
  }

  // Check for raw dangerouslySetInnerHTML without sanitization
  if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
    if (content.includes('dangerouslySetInnerHTML') && !content.includes('sanitize') && !content.includes('DOMPurify')) {
      findings.p2.push({ file: filePath, rule: 'Unsanitized dangerouslySetInnerHTML' });
    }
  }
}

function traverse(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build'].includes(entry.name)) continue;
      traverse(fullPath);
    } else if (entry.isFile()) {
      if (/\.(js|ts|jsx|tsx|json)$/.test(entry.name)) {
        scanFile(fullPath);
      }
    }
  }
}

// Perform scan
scanFile('server.js');
traverse('apps/api');
traverse('apps/web');
traverse('apps/admin');
traverse('packages');
traverse('scripts');

console.log(`Scan completed across ${totalFiles} source files.`);
console.log(`P0 Critical Findings: ${findings.p0.length}`);
console.log(`P1 High Findings: ${findings.p1.length}`);
console.log(`P2 Medium Findings: ${findings.p2.length}`);
console.log(`P3 Low Findings: ${findings.p3.length}`);
console.log(`Hardcoded Secrets Discovered: ${findings.secrets.length}`);
console.log('------------------------------------------------------------');

  if (!fs.existsSync('data')) {
    fs.mkdirSync('data', { recursive: true });
  }

  const report = {
    timestamp: new Date().toISOString(),
    total_files_scanned: totalFiles,
    p0_critical_count: findings.p0.length,
    p1_high_count: findings.p1.length,
    p2_medium_count: findings.p2.length,
    p3_low_count: findings.p3.length,
    secrets_count: findings.secrets.length,
    status: (findings.p0.length === 0 && findings.secrets.length === 0) ? 'PASSED' : 'BLOCKED',
    findings
  };

  fs.writeFileSync('data/sast-report.json', JSON.stringify(report, null, 2));

  if (findings.p0.length > 0 || findings.secrets.length > 0) {
    console.error('SECURITY GATE STATUS: BLOCKED');
    process.exit(1);
  } else {
    console.log('SECURITY GATE STATUS: PASSED');
    process.exit(0);
  }

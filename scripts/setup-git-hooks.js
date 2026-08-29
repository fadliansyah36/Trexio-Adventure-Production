/**
 * Script untuk memasang pre-push hook lokal di .git/hooks/pre-push
 */
const fs = require('fs');
const path = require('path');

const hookDir = path.join(process.cwd(), '.git', 'hooks');
const prePushFile = path.join(hookDir, 'pre-push');

const hookScript = `#!/bin/sh
# TREXIO PRE-PUSH INTEGRITY GATE
echo "Menjalankan pemeriksaan integritas arsitektur & keamanan sebelum push..."
npm run verify-integrity || exit 1
npm run security-scan || exit 1
echo "Integritas Trexio terverifikasi. Melanjutkan git push..."
`;

if (fs.existsSync(hookDir)) {
  fs.writeFileSync(prePushFile, hookScript, { mode: 0o755 });
  console.log('✓ Git pre-push hook berhasil dipasang di .git/hooks/pre-push');
} else {
  console.log('Catatan: Direktori .git/hooks tidak ditemukan di lingkungan container ini. CI/CD GitHub Actions tetap aktif.');
}

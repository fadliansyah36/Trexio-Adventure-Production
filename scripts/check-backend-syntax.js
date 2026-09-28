/**
 * CI backend syntax/parse gate.
 * Node.js executes JavaScript directly, so this is the backend equivalent of
 * a compile gate: every active backend JS module must parse successfully.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const roots = ['server.js', 'src'];
const extensions = new Set(['.js', '.cjs', '.mjs']);
const files = [];

function collect(target) {
  if (!fs.existsSync(target)) return;
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (extensions.has(path.extname(target))) files.push(target);
    return;
  }

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (['node_modules', '.git', 'build', 'dist'].includes(entry.name)) continue;
    collect(path.join(target, entry.name));
  }
}

roots.forEach(collect);

if (files.length === 0) {
  console.error('[Backend Syntax] No backend JavaScript files found.');
  process.exit(1);
}

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  new vm.Script(source, { filename: file });
}

console.log(`[Backend Syntax] PASS — parsed ${files.length} backend JavaScript files successfully.`);

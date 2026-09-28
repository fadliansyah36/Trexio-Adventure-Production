/**
 * JWT security CI gate.
 *
 * This test intentionally does not start the production server or touch the
 * database. It verifies the JWT security contract statically and exercises
 * jsonwebtoken cryptographic behavior with ephemeral test secrets.
 */

const fs = require('fs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const serverSource = fs.readFileSync('server.js', 'utf8');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  console.log(`[JWT Security] PASS — ${message}`);
}

// 1. Production must source JWT_SECRET from the environment.
assert(
  serverSource.includes("process.env.JWT_SECRET"),
  'JWT secret is sourced from process.env.JWT_SECRET'
);

// 2. Production must refuse startup when the secret is absent/weak.
assert(
  /NODE_ENV.*production[\\s\\S]{0,500}JWT_SECRET must be set/.test(serverSource),
  'production startup rejects a missing/weak JWT secret'
);

// 3. Development fallback must be ephemeral, not a hardcoded secret.
assert(
  /crypto\\.randomBytes\\(32\\)/.test(serverSource),
  'development fallback generates an ephemeral 32-byte JWT secret'
);

// 4. The source must not contain a long hardcoded JWT_SECRET assignment.
assert(
  !/JWT_SECRET\\s*=\\s*['"][A-Za-z0-9_\\-+/=]{32,}['"]/.test(serverSource),
  'no long hardcoded JWT secret assignment exists in server.js'
);

// 5. Exercise signing and verification with an ephemeral test secret.
const secret = crypto.randomBytes(32).toString('base64url');
const token = jwt.sign({ sub: 'ci-user', role: 'user' }, secret, {
  expiresIn: '5m',
  issuer: 'trexio-ci'
});

const decoded = jwt.verify(token, secret, { issuer: 'trexio-ci' });
assert(decoded.sub === 'ci-user' && decoded.role === 'user', 'valid JWT signs and verifies correctly');

// 6. Forged signature must fail.
let forgedRejected = false;
try {
  jwt.verify(token, crypto.randomBytes(32).toString('base64url'), { issuer: 'trexio-ci' });
} catch {
  forgedRejected = true;
}
assert(forgedRejected, 'forged JWT signature is rejected');

// 7. Expired token must fail.
const expired = jwt.sign({ sub: 'expired-ci-user' }, secret, { expiresIn: -1 });
let expiredRejected = false;
try {
  jwt.verify(expired, secret);
} catch {
  expiredRejected = true;
}
assert(expiredRejected, 'expired JWT is rejected');

console.log('[JWT Security] ALL JWT SECURITY GATES PASSED');

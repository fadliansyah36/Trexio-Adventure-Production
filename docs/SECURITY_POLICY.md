# TREXIO SECURITY SCANNING & SAST POLICY

## 1. Overview
This policy defines the Static Application Security Testing (SAST), Secret Scanning, and Dependency Management standards enforced across the Trexio Adventure Marketplace and Trexio Backpacker codebases.

## 2. Tools & Automated Security Pipeline
- **Automated SAST & Secret Scanner**: Node.js AST scanner (`/scripts/security-scan.js`) executing secret detection, SQL injection verification, and XSS sanitization checks.
- **CI/CD Security Gate**: GitHub Actions workflow (`/.github/workflows/security-sast.yml`) triggering on Pull Requests, main branch pushes, and weekly scheduled sweeps.
- **Dependency Audit**: Continuous `npm audit` checking for vulnerabilities in runtime dependencies.

## 3. Severity Definitions & Deployment Blocking Policy
- **P0 Critical (BLOCKED)**: Unsafe SQL string concatenation, plaintext hardcoded secrets/private keys, authentication or authorization bypasses, and RCE vulnerabilities.
- **P1 High (BLOCKED)**: High-risk IDOR vectors, unhandled SSRF parameters, or critical reachable third-party dependency vulnerabilities.
- **P2 Medium (NON-BLOCKING WARNING)**: Unsanitized HTML rendering or missing security configuration headers in non-critical modules.
- **P3 Low (INFORMATIONAL)**: Code quality security recommendations and future hardening suggestions.

## 4. Secret Incident Escalation Protocol
If a secret or credential is inadvertently exposed:
1. Revoke and rotate the exposed credential immediately in Cloud Console / Provider dashboard.
2. Update environment secrets in Secret Manager / CI environment configuration.
3. Verify commit history and invalidate any compromised active sessions.

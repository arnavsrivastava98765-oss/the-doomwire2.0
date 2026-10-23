---
name: security-audit
description: Threat modeling, secret protection, vulnerability remediation, and defense-in-depth coding. Use when conducting security reviews or handling authentication and sensitive data.
---

# Security Audit & Hardening

Procedure for reviewing code against OWASP Top 10 vulnerabilities and enforcing security standards.

## Audit Checklist
1. **Secrets & Credentials**:
   - Check git history and workspace for `.env`, private keys (`.pem`, `.key`), access tokens, or hardcoded passwords.
   - Verify `.gitignore` contains `.env`, `.env.local`, `node_modules`, `dist`, `__pycache__`.

2. **Injection Vulnerabilities**:
   - SQL/NoSQL: Enforce parameterized queries or ORMs; forbid string interpolation in queries.
   - Command: Never pass raw user inputs into `child_process.exec` or `os.system`.

3. **Authentication & Authorization**:
   - Verify tokens use secure hashing (bcrypt/argon2) and signatures (JWT with strong secret).
   - Set cookies with `HttpOnly; Secure; SameSite=Strict`.

4. **Dependency Audit**:
   - Execute `npm audit` or `pip audit`.
   - Review and update vulnerable transitive dependencies.

# AI Floor Planner — Security Architecture

## 1. Overview

Security spans authentication, authorization, data protection, AI safety boundaries, and infrastructure hardening.

---

## 2. Authentication

### 2.1 Method

- JWT-based authentication with short-lived access tokens (15 min) and refresh tokens (7 days).
- Passwords hashed with bcrypt (cost factor 12).
- Optional OAuth2/OIDC for SSO (Google, Microsoft) — future phase.

### 2.2 Token Structure

```json
{
  "sub": "user_uuid",
  "org": "org_uuid",
  "role": "user",
  "iat": 1692000000,
  "exp": 1692000900
}
```

### 2.3 Token Storage

- Access token: memory only (not localStorage).
- Refresh token: httpOnly secure cookie.
- CSRF protection via double-submit cookie pattern.

---

## 3. Authorization

### 3.1 RBAC Model

| Role | Permissions |
|------|-------------|
| owner | Full access to organization and all projects |
| admin | Manage members, create/edit/delete projects |
| member | Create/edit own projects, view shared projects |
| viewer | Read-only access to shared projects |

### 3.2 Resource-Level Access

- Users can only access their own projects or projects shared within their organization.
- All API endpoints enforce ownership checks.
- Cross-tenant data access is impossible at the query level.

---

## 4. AI Safety Boundary

### 4.1 What AI Cannot Do

| Action | Prevention |
|--------|-----------|
| Write arbitrary geometry | AI returns structured intent; geometry engine validates |
| Bypass constraint validation | All AI-proposed changes pass through constraint engine |
| Claim construction safety | System explicitly disclaims engineering approval |
| Override hard constraints | Constraint engine rejects regardless of AI suggestion |
| Access other users' data | AI context only includes current user's project data |
| Expose API keys | Provider keys stored server-side, never sent to client |

### 4.2 AI Input Sanitization

- User prompts are sanitized before sending to AI providers.
- Injection attacks (prompt injection) are mitigated by:
  - Structured system prompts that cannot be overridden
  - Response validation against expected schema
  - Never executing AI output as code

### 4.3 AI Output Validation

Every AI response is validated:
1. JSON schema validation for structured responses.
2. Range checks on all numeric values (dimensions must be positive, within plot).
3. Entity ID validation (referenced IDs must exist in model).
4. No response is trusted without constraint engine verification.

---

## 5. Data Protection

### 5.1 Data at Rest

- Database encrypted at rest (AES-256).
- Backups encrypted with separate key.
- File exports stored in encrypted object storage.

### 5.2 Data in Transit

- TLS 1.3 for all connections.
- HTTPS enforced (HSTS).
- WebSocket connections over WSS.
- AI provider calls over HTTPS with certificate pinning.

### 5.3 Data Isolation

- Multi-tenant data isolation at the database query level.
- Organization boundaries enforced in every query.
- No shared caches between tenants (cache keys include tenant ID).

---

## 6. API Security

### 6.1 Input Validation

- All request bodies validated against JSON Schema.
- Parameter sanitization for SQL injection prevention.
- File upload restrictions (type, size).

### 6.2 Rate Limiting

- Per-user, per-endpoint rate limits (see API_CONTRACTS.md).
- Exponential backoff for repeated failures.
- DDoS protection at infrastructure level.

### 6.3 CORS

- Strict origin whitelist.
- No wildcard origins in production.
- Credentials mode restricted to same-site.

### 6.4 Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Content-Security-Policy: default-src 'self'
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 7. Dependency Security

- Automated dependency vulnerability scanning (npm audit, Snyk/Dependabot).
- No known-vulnerable packages in production.
- Lock files committed for reproducible builds.
- Minimal dependency surface area.

---

## 8. Secrets Management

- Environment variables for configuration, never hardcoded.
- AI provider API keys stored in secrets manager (AWS Secrets Manager / Vault).
- Database credentials rotated periodically.
- No secrets in version control.

---

## 9. Logging & Monitoring

### 9.1 Security Events

- Failed authentication attempts
- Authorization failures
- Rate limit breaches
- AI request anomalies
- Data access patterns

### 9.2 Audit Trail

- All plan modifications logged (who, when, what changed).
- AI request/response pairs retained (without sensitive data).
- Export actions logged.
- Account management changes logged.

### 9.3 PII in Logs

- No passwords, tokens, or API keys in logs.
- User emails hashed in analytics logs.
- IP addresses retained for 30 days only.

---

## 10. Compliance Considerations

- GDPR: data export, deletion rights, consent management.
- Data residency: database in user-selected region.
- Right to be forgotten: soft-delete + scheduled hard-delete for user data.
- AI model providers: ensure data processing agreements are in place.

---

## 11. Incident Response

1. Detect: automated monitoring and alerting.
2. Contain: ability to revoke tokens, disable accounts, block IPs.
3. Investigate: audit logs and request traces.
4. Remediate: patch, rotate credentials, notify affected users.
5. Review: post-incident report, update security controls.

---

## 12. Disclaimer

The AI Floor Planner system is a design assistance tool. It does NOT provide:
- Structural engineering certification
- Building code compliance verification
- Construction safety assurance
- Legal regulatory approval

All plans generated must be reviewed by qualified professionals before construction.

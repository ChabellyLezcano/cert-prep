# Security Policy

## Reporting Security Issues

**Do not open public issues for security vulnerabilities.**

Please email security concerns to the project maintainer privately.

---

## Security Practices

### Secrets & Environment Variables

- ✅ `.env` is in `.gitignore` — never commit
- ✅ `.env.example` documents required variables (without values)
- ✅ Pre-commit hooks check for secret patterns
- ✅ CI uses GitHub secrets, not hardcoded values

**Before committing:**

```bash
grep -r "VITE_\|SUPABASE_" src/ --include="*.ts" --include="*.tsx"
# Should only find imports, not hardcoded values
```

---

### Dependencies

- ✅ Audit on install: `npm ci` checks vulnerabilities
- ✅ No `npm install` with untrusted sources
- ✅ `package-lock.json` is committed for reproducibility
- ✅ Dependabot replaced with manual review process
- ✅ Update only when needed: `npm audit fix`

**Check for vulnerabilities:**

```bash
npm audit
npm audit --audit-level=high  # Fails on high/critical
```

---

### Code Security

**Type Safety:**

- TypeScript strict mode enabled (`strict: true`)
- No `any` types allowed
- Index access checked (`noUncheckedIndexedAccess`)

**Input Validation:**

- All user inputs validated with Zod
- API responses validated
- Environment variables checked at startup

**Supabase Row-Level Security:**

- Authentication required for all operations
- Users can only access their own progress
- No direct table access from client code

**API Security:**

- No secrets in request headers (token in AuthContext)
- CORS configured (Supabase handles)
- Rate limiting prevents abuse

---

### Error Handling

**Don't expose sensitive info:**

```typescript
// ❌ Bad: exposes database error
catch (error: any) {
  console.error(error.message); // "User table not found"
}

// ✅ Good: generic error message
catch (error) {
  logger.error('Failed to load data', { /* context */ });
  showUserError('Something went wrong. Please try again.');
}
```

---

### Authentication

**Supabase Auth Flow:**

1. User signs up/in via email/password
2. Supabase returns JWT token
3. Token stored in AuthContext (not localStorage)
4. Token automatically sent with each request
5. Server validates token via RLS policies

**Never:**

- Store passwords in plaintext
- Send credentials in URLs or headers except Authorization
- Cache sensitive data in localStorage
- Log authentication tokens

---

### Docker & Deployment

**Secrets:**

- Never hardcode secrets in Dockerfile
- Use build args only for public values (Supabase URL/anon key)
- Service role key **never** goes into image

**Image Security:**

- Use official base image (`node:26-alpine`)
- Keep image updated
- Don't run as root
- Remove dev dependencies in production

---

### Data & Privacy

**User Data:**

- Progress data stored in Supabase (encrypted at rest)
- Only accessible to the user who created it
- No data sold or shared
- GDPR compliance: users can request deletion

**Backups:**

- Supabase handles backups automatically
- See [Supabase docs](https://supabase.com/docs) for backup policy

---

### Third-Party Services

**External APIs:**

- Supabase auth (Google, GitHub, etc.) — review their privacy policies
- No analytics/tracking cookies
- No third-party ads or marketing pixels

---

### Development Security Checklist

Before committing:

- [ ] No `.env` files committed
- [ ] No hardcoded secrets in code
- [ ] No `console.log()` with sensitive data
- [ ] Input validation for all forms
- [ ] TypeScript strict mode passes
- [ ] ESLint security rules pass
- [ ] Tests pass
- [ ] Pre-commit hooks approved

Before pushing:

- [ ] No force-push to shared branches
- [ ] Commit messages don't reference vulnerabilities
- [ ] No binary files (use `.gitignore`)

---

### Monitoring & Logging

**Safe Logging:**

```typescript
// ✅ Good: log context without secrets
logger.info('Login attempt', { email: user.email, timestamp });

// ❌ Bad: logs password or token
logger.info('Login', { password, token });
```

**Future Enhancements:**

- Integrate Sentry for error tracking
- Add DataDog for performance monitoring
- Set up log retention policy

---

## Compliance

- 🔒 TypeScript strict mode
- 🔒 ESLint security + accessibility rules
- 🔒 Supabase row-level security
- ♿ WCAG AA accessibility compliance
- ✅ HTTPS only (enforced by Supabase)

---

## Security Headers

Nginx is configured with:

- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-XSS-Protection: 1; mode=block` — XSS prevention

See `nginx.conf` for details.

---

## Questions?

- Check [Supabase Security](https://supabase.com/docs/guides/database/security)
- Read [OWASP Top 10](https://owasp.org/Top10/)
- Review [TypeScript Security](https://www.typescriptlang.org/docs/)

---

Last updated: October 2026

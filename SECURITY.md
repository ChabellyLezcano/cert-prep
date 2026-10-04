# Security Policy

## Reporting a vulnerability

Do not open a public issue. Use GitHub's private vulnerability reporting
(Security tab → Report a vulnerability) or contact the maintainer directly.

## What is in place

- **Secrets:** `.env` is git-ignored and `.env.example` documents the variables. Only the public
  Supabase URL and anon key reach the browser; `SUPABASE_SERVICE_ROLE_KEY` is used only by the local
  seed script and must never be added to the build, Vercel or the Docker image.
- **Secret scanning:** gitleaks runs in CI over the full history.
- **Dependencies:** `npm audit --audit-level=high` runs in CI and fails the build on high or
  critical findings. Update dependencies manually when the audit reports something.
- **Static analysis:** CodeQL runs on every pull request and on `main`.
- **Data access:** per-user tables use Supabase row-level security (see `supabase/migrations/`);
  access is enforced by the database, not by hiding the anon key.
- **Input validation:** the login and signup forms are validated with Zod.
- **Startup checks:** the app refuses to render when `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`
  is missing.
- **Headers (Docker/Nginx):** `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` and
  `Referrer-Policy: strict-origin-when-cross-origin` (see `nginx.conf`). `vercel.json` sets the
  first two for Vercel deployments.

## Known limitations

- The Supabase session is persisted by `supabase-js` in the browser's local storage
  (`persistSession: true`). This is the library default; it is exposed to any script that runs on
  the page, so avoid adding third-party scripts.
- There is no client- or server-side rate limiting beyond what Supabase provides.
- Production errors are only logged to the browser console; no error-tracking service is connected.

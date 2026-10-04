# Deployment

## Vercel (production)

The repository is connected to the Vercel project `dea-cert-react`. Every pull request gets a preview
deployment and every merge to `main` deploys to production.

Settings live in `vercel.json` (Vite build, SPA rewrite to `/index.html`, cache and security headers).
Environment variables are **not** stored in the repository. Set them in Vercel → Settings →
Environment Variables for Production and Preview:

| Variable                 | Value                      |
| ------------------------ | -------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL       |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

Never add `SUPABASE_SERVICE_ROLE_KEY`. The values are baked in at build time, so redeploy after
changing them. If they are missing, the app shows a blank page and logs an error to the console.

To roll back, promote a previous deployment from the Vercel dashboard.

## Docker

```bash
docker compose build \
  --build-arg VITE_SUPABASE_URL=https://your-project-ref.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=your-anon-public-key
docker compose up
```

The static build is served by Nginx on `http://localhost:8080` (config in `nginx.conf`, health check
in the `Dockerfile`).

## Database

Apply migrations with `npm run db:migrate` and load content with `npm run db:seed` from a machine with
the `.env` filled in. Neither step runs as part of a deployment.

## CI

`.github/workflows/ci.yml` runs lint, type checks, format check, unit tests with coverage, build and
Playwright (Chromium). `.github/workflows/security.yml` runs `npm audit`, gitleaks and CodeQL.

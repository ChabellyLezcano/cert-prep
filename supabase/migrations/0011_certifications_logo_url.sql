-- supabase/migrations/0011_certifications_logo_url.sql
-- Adds an optional logo_url column to certifications, mirroring the new
-- `logoUrl` field on CertificationMeta in src/certifications/registry.ts.
-- Additive and nullable -- safe to run on a live DB, no backfill required
-- since the frontend already falls back to an acronym badge when absent.

alter table public.certifications
  add column if not exists logo_url text;

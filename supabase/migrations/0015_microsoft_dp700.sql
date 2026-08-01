-- supabase/migrations/0015_microsoft_dp700.sql
-- Fifth certification: Microsoft DP-700 (Fabric Data Engineer
-- Associate). Minimal viable content, added to validate the multi-cert
-- model end to end (see src/quiz/data/microsoft-dp-700). Domain weights
-- use the midpoint of each range published in Microsoft's skills-measured
-- guide (see the note in domains.ts) -- logo_url already exists as a
-- column since 0011, so this only inserts rows (same shape as
-- 0012_microsoft_pl_300.sql).

insert into public.certifications (id, name, provider, exam_guide_version, logo_url)
values (
  'microsoft-dp-700',
  'Fabric Data Engineer Associate',
  'Microsoft',
  '2026-07-21',
  '/certifications/microsoft-dp-700.svg'
)
on conflict (id) do nothing;

insert into public.domains (cert_id, code, name, weight, domain_order)
values
  ('microsoft-dp-700', 'IMPL', 'Implement and manage an analytics solution', 33, 1),
  ('microsoft-dp-700', 'ING', 'Ingest and transform data', 33, 2),
  ('microsoft-dp-700', 'MON', 'Monitor and optimize an analytics solution', 34, 3)
on conflict (cert_id, code) do nothing;

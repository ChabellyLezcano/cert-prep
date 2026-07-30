-- supabase/migrations/0012_microsoft_pl_300.sql
-- Fourth certification: Microsoft PL-300 (Power BI Data Analyst
-- Associate). Minimal viable content, added to validate the multi-cert
-- model end to end (see src/quiz/data/microsoft-pl-300). Domain weights
-- use the midpoint of each range published in Microsoft's skills-measured
-- guide (see the note in domains.ts) -- run after 0011, which adds the
-- logo_url column this insert populates.

insert into public.certifications (id, name, provider, exam_guide_version, logo_url)
values (
  'microsoft-pl-300',
  'Power BI Data Analyst Associate',
  'Microsoft',
  '2026-04-20',
  '/certifications/microsoft-pl-300.svg'
)
on conflict (id) do nothing;

insert into public.domains (cert_id, code, name, weight, domain_order)
values
  ('microsoft-pl-300', 'PREP', 'Prepare the data', 17, 1),
  ('microsoft-pl-300', 'MODEL', 'Model the data', 32, 2),
  ('microsoft-pl-300', 'VIS', 'Visualize and analyze the data', 28, 3),
  ('microsoft-pl-300', 'MANAGE', 'Manage and secure Power BI', 23, 4)
on conflict (cert_id, code) do nothing;

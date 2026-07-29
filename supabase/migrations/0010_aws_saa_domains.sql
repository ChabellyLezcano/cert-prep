-- supabase/migrations/0010_aws_saa_domains.sql
-- Adds the 3 official AWS SAA-C03 domains that were not yet loaded
-- (0005_aws_saa.sql only seeded SEC as minimal viable content). See
-- src/quiz/data/aws-saa/domains.ts for the source of truth.

insert into public.domains (cert_id, code, name, weight, domain_order)
values
  ('aws-saa', 'RES', 'Design Resilient Architectures', 26, 2),
  ('aws-saa', 'PERF', 'Design High-Performing Architectures', 24, 3),
  ('aws-saa', 'COST', 'Design Cost-Optimized Architectures', 20, 4)
on conflict (cert_id, code) do nothing;

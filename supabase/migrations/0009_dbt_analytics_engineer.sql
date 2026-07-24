-- supabase/migrations/0009_dbt_analytics_engineer.sql
-- Third certification: dbt Analytics Engineering Certification Exam.
-- Minimal viable content, added to validate the multi-cert model end to
-- end (see src/quiz/data/dbt-analytics-engineer). Domain weights are an
-- even split -- dbt Labs doesn't publish official per-topic percentages
-- the way Databricks/AWS do (see the note in domains.ts).

insert into public.certifications (id, name, provider, exam_guide_version)
values ('dbt-analytics-engineer', 'Analytics Engineering Certification', 'dbt Labs', 'v1.7')
on conflict (id) do nothing;

insert into public.domains (cert_id, code, name, weight, domain_order)
values
  ('dbt-analytics-engineer', 'DEV', 'Developing dbt Models', 12.5, 1),
  ('dbt-analytics-engineer', 'GOV', 'Understanding dbt Model Governance', 12.5, 2),
  ('dbt-analytics-engineer', 'DBG', 'Debugging Data Modeling Errors', 12.5, 3),
  ('dbt-analytics-engineer', 'PIPE', 'Managing Data Pipelines', 12.5, 4),
  ('dbt-analytics-engineer', 'TEST', 'Implementing dbt Tests', 12.5, 5),
  ('dbt-analytics-engineer', 'DOC', 'Creating and Maintaining dbt Documentation', 12.5, 6),
  ('dbt-analytics-engineer', 'EXT', 'Implementing and Maintaining External Dependencies', 12.5, 7),
  ('dbt-analytics-engineer', 'STATE', 'Leveraging the dbt State', 12.5, 8)
on conflict (cert_id, code) do nothing;

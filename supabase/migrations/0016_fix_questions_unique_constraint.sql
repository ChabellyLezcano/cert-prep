-- supabase/migrations/0016_fix_questions_unique_constraint.sql
-- Repairs the state left by 0014_fix_exam_n_constraint.sql, which was
-- truncated mid-statement (ADD CONSTRAINT ... UNIQUE (cert_id, e) never
-- closed). Depending on how far it got, `questions` may have been left:
--   - without the old questions_exam_n_key constraint (0014 dropped it), and
--   - without the new questions_cert_exam_n_key (the ADD failed on syntax).
--
-- This migration lands the correct final state no matter what: uniqueness
-- must be scoped to (cert_id, exam, n), not (exam, n), so two different
-- certifications can share the same exam/question number (e.g. exam=1,
-- n=1 in both databricks-dea and microsoft-pl-300).
--
-- Idempotent: re-running it is a no-op.
--
-- Run after 0001-0015, or via `supabase db push`.

begin;

-- 1. Drop the old, too-narrow constraint if it still exists.
alter table public.questions
  drop constraint if exists questions_exam_n_key;

-- 2. Drop the new one too, in case 0014 left it half-created or duplicated,
--    so we can recreate it cleanly (conditional drop -> no error if absent).
alter table public.questions
  drop constraint if exists questions_cert_exam_n_key;

-- 3. Before recreating, abort if any duplicate (cert_id, exam, n) exists
--    that would make the UNIQUE constraint fail (belt-and-braces check).
do $$
declare
  dupes integer;
begin
  select count(*) into dupes
  from (
    select cert_id, exam, n
    from public.questions
    group by cert_id, exam, n
    having count(*) > 1
  ) d;
  if dupes > 0 then
    raise exception
      'Aborting: % duplicate (cert_id, exam, n) rows would violate the constraint', dupes;
  end if;
end $$;

-- 4. Add the corrected constraint, scoped per certification.
alter table public.questions
  add constraint questions_cert_exam_n_key unique (cert_id, exam, n);

commit;
-- supabase/migrations/0016_question_progress_cert_id.sql
-- Records the cert_id column on question_progress that was added manually
-- via the SQL editor. Idempotent so it's a no-op on the DB where it
-- already exists, and applies cleanly on a fresh DB (CI, new environments).

alter table public.question_progress
  add column if not exists cert_id text;

-- Backfill from the linked question (no-op if already populated).
update public.question_progress qp
set cert_id = q.cert_id
from public.questions q
where qp.question_id = q.id
  and qp.cert_id is null;

-- Enforce NOT NULL only once every row has a value.
alter table public.question_progress
  alter column cert_id set not null;

-- FK into certifications, guarded so re-running doesn't error.
alter table public.question_progress
  drop constraint if exists question_progress_cert_id_fkey;
alter table public.question_progress
  add constraint question_progress_cert_id_fkey
  foreign key (cert_id) references public.certifications (id);
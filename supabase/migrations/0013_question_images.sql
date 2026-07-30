-- supabase/migrations/0013_question_images.sql
-- Adds optional image support to questions (e.g. HOTSPOT/exhibit
-- screenshots from PL-300). Images live in a public Supabase Storage
-- bucket rather than as data URLs in the row, so the seeded rows stay
-- small and images can be swapped/re-uploaded independently of a reseed.
--
-- `questions.image_url` stores the OBJECT PATH within the bucket (e.g.
-- "microsoft-pl-300/30701.png"), not a full URL -- the app resolves it to
-- a public URL client-side via supabase.storage.getPublicUrl(), which
-- keeps the value portable across Supabase projects/environments.
--
-- Run after 0012, or via `supabase db push`.

alter table public.questions
  add column if not exists image_url text;

-- Public, read-only bucket: exam screenshots aren't sensitive, and every
-- signed-in user already reads the same `questions` content. Uploads only
-- ever happen from the seeding script (service role key), never from the
-- browser, so no insert/update/delete policy is needed for authenticated
-- users -- only a public select.
insert into storage.buckets (id, name, public)
values ('question-images', 'question-images', true)
on conflict (id) do nothing;

create policy "Public read access to question images"
  on storage.objects for select
  to public
  using (bucket_id = 'question-images');

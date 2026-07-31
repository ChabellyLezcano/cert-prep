-- Fix: the UNIQUE constraint on (exam, n) doesn't account for cert_id, so
-- two different certifications sharing the same exam/question number (e.g.
-- exam=1, n=1 in both databricks-dea and microsoft-pl-300) collide. Same
-- root cause as the id-collision bug fixed in bank.ts -- this constraint
-- needs the same fix: scope uniqueness to (cert_id, exam, n) instead of
-- just (exam, n).

-- 1. Drop the old, too-narrow constraint.
ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_exam_n_key;

-- 2. Add the corrected constraint, scoped per certification.
ALTER TABLE questions
  ADD CONSTRAINT questions_cert_exam_n_key UNIQUE (cert_id, e
 
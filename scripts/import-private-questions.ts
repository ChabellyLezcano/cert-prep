/**
 * Imports personally licensed questions from `private-data/<certId>/examNNN.json`
 * straight into Supabase. The folder is git-ignored on purpose: this repository
 * and the Vercel site are public, so licensed content must never be committed.
 *
 * File format (one file per practice set, NNN >= 200 so it never collides with
 * the exam numbers already committed under src/quiz/data):
 *   [{ "n": 1, "domain": "SEC", "multi": false, "question": "...",
 *      "options": ["...", "..."], "answers": [0], "explanation": "..." }]
 * `answers` are zero-based indexes into `options`.
 *
 * Usage:
 *   npm run db:import-private -- aws-saa            # validate only (dry run)
 *   npm run db:import-private -- aws-saa --apply    # validate and upsert
 *
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
 */
import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/types/database.types';
import { DOMAINS as AWS_DOMAINS } from '@/quiz/data/aws-saa/domains';

const DOMAINS_BY_CERT: Record<string, string[]> = { 'aws-saa': AWS_DOMAINS.map((d) => d.id) };
const MIN_EXAM_NUMBER = 200;
const CHUNK_SIZE = 200;

const QuestionSchema = z
  .object({
    n: z.number().int().positive(),
    domain: z.string(),
    multi: z.boolean(),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2),
    answers: z.array(z.number().int().nonnegative()).min(1),
    explanation: z.string().default(''),
  })
  .refine((q) => q.answers.every((a) => a < q.options.length), { message: 'answer index out of range' })
  .refine((q) => q.multi === q.answers.length > 1, { message: 'multi flag does not match answers' });

function loadFiles(certId: string, dir: string) {
  const rows: Database['public']['Tables']['questions']['Insert'][] = [];
  const seen = new Set<string>();
  const validDomains = DOMAINS_BY_CERT[certId];
  if (!validDomains) throw new Error(`Unknown certId "${certId}"`);

  for (const file of readdirSync(dir).filter((f) => /^exam\d+\.json$/.test(f))) {
    const exam = Number(/\d+/.exec(file)![0]);
    if (exam < MIN_EXAM_NUMBER) throw new Error(`${file}: exam number must be >= ${MIN_EXAM_NUMBER}`);
    const parsed = z.array(QuestionSchema).parse(JSON.parse(readFileSync(join(dir, file), 'utf8')));
    for (const q of parsed) {
      if (!validDomains.includes(q.domain)) throw new Error(`${file} n=${q.n}: unknown domain "${q.domain}"`);
      const id = `${certId}-${exam}${String(q.n).padStart(2, '0')}`;
      if (seen.has(id)) throw new Error(`${file}: duplicate question number ${q.n}`);
      seen.add(id);
      rows.push({
        id,
        cert_id: certId,
        exam,
        n: q.n,
        domain: q.domain,
        is_multi: q.multi,
        question_en: q.question,
        options_en: q.options,
        correct_answers: q.answers,
        explanation_en: q.explanation || null,
        explanation_es: q.explanation,
      });
    }
  }
  return rows;
}

async function main() {
  const [certId, ...flags] = process.argv.slice(2);
  if (!certId) throw new Error('Usage: npm run db:import-private -- <certId> [--apply]');

  const rows = loadFiles(certId, join('private-data', certId));
  console.log(`Validated ${rows.length} questions for ${certId}.`);
  if (!flags.includes('--apply')) return console.log('Dry run only. Re-run with --apply to upsert.');

  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  const supabase = createClient<Database>(url, key, { auth: { persistSession: false } });

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase
      .from('questions')
      .upsert(rows.slice(i, i + CHUNK_SIZE), { onConflict: 'id' });
    if (error) throw new Error(`Upsert failed: ${error.message}`);
  }
  console.log(`Upserted ${rows.length} questions.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

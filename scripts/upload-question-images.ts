/**
 * Uploads exhibit/screenshot images referenced by RawQuestion.image to the
 * public `question-images` Supabase Storage bucket (see
 * supabase/migrations/0013_question_images.sql).
 *
 * Reads every file under `assets/question-images/` and uploads it to the
 * bucket at the same relative path (e.g. a local file at
 * `assets/question-images/microsoft-pl-300/30701.png` is uploaded as
 * object path `microsoft-pl-300/30701.png` -- the exact string questions
 * store in their `image` field). Run this BEFORE `npm run db:seed` for any
 * exam file that references images, so the objects exist by the time
 * useQuestionBank resolves them to public URLs.
 *
 * Usage:
 *   npm run upload-question-images
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (same as scripts/seed.ts).
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';
import process from 'process';

const ASSETS_DIR = join(process.cwd(), 'assets', 'question-images');
const BUCKET = 'question-images';

const CONTENT_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing environment variables. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before uploading images.',
    );
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const files = walk(ASSETS_DIR);
  console.log(`Uploading ${files.length} image(s) to bucket "${BUCKET}"...`);

  for (const filePath of files) {
    const objectPath = relative(ASSETS_DIR, filePath).split('\\').join('/'); // Windows path safety
    const ext = objectPath.slice(objectPath.lastIndexOf('.')).toLowerCase();
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      console.warn(`  skip (unsupported extension): ${objectPath}`);
      continue;
    }

    const body = readFileSync(filePath);
    const { error } = await supabase.storage.from(BUCKET).upload(objectPath, body, {
      contentType,
      upsert: true,
    });

    if (error) {
      console.error(`  FAILED: ${objectPath} -- ${error.message}`);
      continue;
    }
    console.log(`  ...${objectPath}`);
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

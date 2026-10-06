/**
 * Converts a practice set pasted as plain text into the JSON format read by
 * `import-private-questions.ts`. Everything stays inside the git-ignored
 * `private-data/` folder.
 *
 * Input:  private-data/raw/<certId>/setNN.txt   (the page text, pasted as-is)
 * Output: private-data/<certId>/exam(200+NN).json
 *
 * Usage:
 *   npm run db:convert-private -- aws-saa 1            # set 1 -> exam201.json
 *   npm run db:convert-private -- aws-saa 1 --force    # overwrite hand edits
 *
 * Questions whose correct answer cannot be determined with confidence are
 * written with `"answers": []`: fill them in by hand (zero-based indexes into
 * `options`) before importing. Domains are keyword-based guesses; adjust them
 * in the JSON if one is wrong.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { parsePracticeSet } from './lib/practiceSetParser';

const SUPPORTED_CERTS = ['aws-saa'];
const EXAM_OFFSET = 200;

function main() {
  const [certId, setArg, ...flags] = process.argv.slice(2);
  const setNumber = Number(setArg);
  if (!certId || !Number.isInteger(setNumber) || setNumber < 1) {
    throw new Error('Usage: npm run db:convert-private -- <certId> <setNumber> [--force]');
  }
  if (!SUPPORTED_CERTS.includes(certId)) throw new Error(`Unsupported certId "${certId}"`);

  const input = join('private-data', 'raw', certId, `set${String(setNumber).padStart(2, '0')}.txt`);
  if (!existsSync(input)) throw new Error(`Input not found: ${input}`);
  const examNumber = EXAM_OFFSET + setNumber;
  const outDir = join('private-data', certId);
  const output = join(outDir, `exam${examNumber}.json`);
  if (existsSync(output) && !flags.includes('--force')) {
    throw new Error(`${output} already exists (it may contain hand edits). Use --force to overwrite.`);
  }

  const { questions, unresolved, malformed } = parsePracticeSet(readFileSync(input, 'utf8'));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(output, `${JSON.stringify(questions, null, 2)}\n`);

  const domains = questions.reduce<Record<string, number>>(
    (acc, q) => ({ ...acc, [q.domain]: (acc[q.domain] ?? 0) + 1 }),
    {},
  );
  console.log(`Wrote ${questions.length} questions to ${output}`);
  console.log(`Domains (guessed): ${JSON.stringify(domains)}`);
  console.log(`Needs a manual answer (${unresolved.length}): ${unresolved.join(', ') || 'none'}`);
  console.log(`Could not be parsed (${malformed.length}): ${malformed.join(', ') || 'none'}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

/**
 * Converts a practice-set JSON export (tests -> questions with HTML stems,
 * options flagged `correct` and an HTML explanation) into the per-exam files
 * read by `import-private-questions.ts`. Everything stays inside the
 * git-ignored `private-data/` folder.
 *
 * Input:  any path to the export (`{ tests: [{ title: "Test N", questions }] }`)
 * Output: private-data/<certId>/exam(200+N).json, one file per test
 *
 * Usage:
 *   npm run db:convert-private-json -- aws-saa path/to/export.json
 *   npm run db:convert-private-json -- aws-saa path/to/export.json --force
 *
 * Domains are keyword-based guesses (see classifyDomain); adjust them in the
 * JSON if one is wrong.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { z } from 'zod';
import { classifyDomain, type ParsedQuestion } from './lib/practiceSetParser';

const SUPPORTED_CERTS = ['aws-saa'];
const EXAM_OFFSET = 200;

const ExportSchema = z.object({
  tests: z.array(
    z.object({
      title: z.string(),
      questions: z.array(
        z.object({
          number: z.number().int().positive(),
          questionHtml: z.string(),
          options: z.array(z.object({ text: z.string(), correct: z.boolean() })),
          explanationHtml: z.string().default(''),
        }),
      ),
    }),
  ),
});

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function htmlToText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#\d+|[a-z]+);/gi, (match, entity: string) =>
      entity.startsWith('#') ? String.fromCodePoint(Number(entity.slice(1))) : (ENTITIES[entity] ?? match),
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Drops the leading "Correct"/"Incorrect" banner the quiz widget prints above every explanation. */
function cleanExplanation(html: string): string {
  return htmlToText(
    html
      .replace(/<span class="wpProQuiz_respone_span">[\s\S]*?<\/span>/, '')
      .replace(/<\/h2>/g, ': ')
      .replace(/<\/strong>\s*<br>/g, ' — '),
  );
}

function main() {
  const [certId, input, ...flags] = process.argv.slice(2);
  if (!certId || !input)
    throw new Error('Usage: npm run db:convert-private-json -- <certId> <export.json> [--force]');
  if (!SUPPORTED_CERTS.includes(certId)) throw new Error(`Unsupported certId "${certId}"`);

  const { tests } = ExportSchema.parse(JSON.parse(readFileSync(input, 'utf8')));
  const outDir = join('private-data', certId);
  mkdirSync(outDir, { recursive: true });

  for (const test of tests) {
    const setNumber = Number(/\d+/.exec(test.title)?.[0]);
    if (!Number.isInteger(setNumber) || setNumber < 1)
      throw new Error(`Cannot read a set number from "${test.title}"`);

    const questions: ParsedQuestion[] = test.questions.map((q) => {
      const question = htmlToText(q.questionHtml);
      const options = q.options.map((o) => htmlToText(o.text));
      const answers = q.options.flatMap((o, i) => (o.correct ? [i] : []));
      return {
        n: q.number,
        domain: classifyDomain(`${question} ${options.join(' ')}`),
        multi: answers.length > 1,
        question,
        options,
        answers,
        explanation: cleanExplanation(q.explanationHtml),
      };
    });

    const output = join(outDir, `exam${EXAM_OFFSET + setNumber}.json`);
    try {
      writeFileSync(output, `${JSON.stringify(questions, null, 2)}\n`, {
        flag: flags.includes('--force') ? 'w' : 'wx',
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`${output} already exists (it may contain hand edits). Use --force to overwrite.`, {
          cause: error,
        });
      }
      throw error;
    }
    console.log(`${test.title}: wrote ${questions.length} questions to ${output}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

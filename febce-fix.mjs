/**
 * Scans EVERY exam data file, across EVERY certification, for questions
 * where a single code snippet got split across 2+ separate ```...```
 * fence pairs -- leaving the "gap" text between pairs rendered as
 * unstyled plain text in QuestionCard instead of as part of the code
 * block. Where the gap is unambiguously more code (identifiers,
 * brackets, SQL/Python syntax, quoted values), it merges the pairs into
 * one. Where the gap reads like a narrative sentence introducing a
 * genuinely separate second command ("Later, the team runs:", "and
 * later runs:"), it leaves the question untouched -- those are correct
 * as-is.
 *
 * Discovers files the same way src/quiz/data/bank.ts does:
 *   - src/quiz/data/<certId>/exams.ts            (consolidated, one file per cert)
 *   - src/quiz/data/<certId>/exams/examN.ts       (legacy, one file per exam)
 *
 * How it finds and edits strings: rather than importing/parsing the
 * TypeScript (which would require re-serializing objects and risks
 * reformatting the whole file), it tokenizes each file's raw text for
 * single- and double-quoted JS string literals, decodes each one,
 * checks it for the broken-fence pattern, and -- only when every gap in
 * that string is code-shaped -- rewrites just that literal in place
 * using its original quote style. Everything else in the file (other
 * strings, formatting, comments) is left byte-for-byte untouched.
 *
 * Known limitations (deliberately NOT auto-fixed, left for manual
 * review):
 *   - A field with an ODD number of ``` markers (unbalanced fences) --
 *     e.g. a code example missing its opening fence. There's no safe
 *     generic way to guess where the missing fence belongs.
 *   - A single ```...``` pair that wraps plain English instead of code
 *     (e.g. an answer option mistakenly fenced). Detecting "this fenced
 *     text isn't really code" generically is too failure-prone to
 *     automate; these need a human read.
 *
 * Usage:
 *   npx vite-node scripts/fix-broken-fences-all.mjs            # apply
 *   npx vite-node scripts/fix-broken-fences-all.mjs --dry-run   # report only
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.argv.includes('--dry-run');
const DATA_DIR = 'src/quiz/data';

// ---------- 1. Discover every exam file, mirroring bank.ts's globs ----------

function discoverExamFiles() {
  const files = [];
  const certDirs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  for (const certId of certDirs) {
    const consolidated = join(DATA_DIR, certId, 'exams.ts');
    if (existsSync(consolidated)) files.push(consolidated);

    const legacyDir = join(DATA_DIR, certId, 'exams');
    if (existsSync(legacyDir)) {
      for (const f of readdirSync(legacyDir)) {
        if (/^exam\d+\.ts$/.test(f)) files.push(join(legacyDir, f));
      }
    }
  }
  return files;
}

// ---------- 2. JS string-literal tokenizer (single- and double-quoted) ----------

const STRING_LITERAL = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g;

function decodeJsString(literal) {
  const body = literal.slice(1, -1);
  let out = '';
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\') {
      const next = body[i + 1];
      if (next === 'n') out += '\n';
      else if (next === 't') out += '\t';
      else if (next === 'r') out += '\r';
      else out += next; // \\, \', \", or anything else -> literal char
      i++;
    } else {
      out += body[i];
    }
  }
  return out;
}

function encodeJsString(value, delim) {
  let out = '';
  for (const ch of value) {
    if (ch === '\\') out += '\\\\';
    else if (ch === delim) out += '\\' + delim;
    else if (ch === '\n') out += '\\n';
    else if (ch === '\t') out += '\\t';
    else if (ch === '\r') out += '\\r';
    else out += ch;
  }
  return delim + out + delim;
}

// ---------- 3. Broken-fence detection + merge ----------

// A gap between two fence pairs is treated as a deliberate narrative
// separator (leave alone) only if it's a short, punctuation-free clause
// ending in ':' -- e.g. "and later runs:", "Later, the team runs:". Any
// gap containing code punctuation, digits, quotes, or that doesn't fit
// that shape is treated as a broken split (safe to merge).
function isNarrativeGap(gap) {
  const trimmed = gap.trim();
  if (trimmed.length === 0) return false;
  const shapeOk = /^[a-zA-Z][a-zA-Z ,'-]{0,60}:$/.test(trimmed);
  const wordCount = trimmed.split(/\s+/).length;
  return shapeOk && wordCount <= 8;
}

/**
 * Returns { changed, value, note } where note explains why nothing was
 * done, if applicable.
 */
function tryMergeBrokenFences(value) {
  if (!value.includes('```')) return { changed: false, value };

  const parts = value.split('```');
  if (parts.length < 5) return { changed: false, value }; // 0 or 1 fence pair, nothing to merge

  if (parts.length % 2 === 0) {
    return {
      changed: false,
      value,
      note: 'unbalanced fence count (odd number of ``` markers) -- needs manual review',
    };
  }

  const gapIndices = [];
  for (let i = 2; i < parts.length - 1; i += 2) gapIndices.push(i);

  if (gapIndices.some((i) => isNarrativeGap(parts[i]))) {
    return { changed: false, value, note: 'looks like two genuinely separate commands -- left as-is' };
  }

  let merged = parts[1];
  for (let i = 2; i < parts.length - 1; i += 2) {
    merged += parts[i] + parts[i + 1];
  }
  const newValue = parts[0] + '```' + merged + '```' + parts[parts.length - 1];
  return { changed: newValue !== value, value: newValue };
}

// ---------- 4. Apply across a file, tracking question number for reporting ----------

const N_FIELD = /\bn:\s*(\d+),/g;

function nearestQuestionNumber(text, position) {
  let match;
  let best = null;
  N_FIELD.lastIndex = 0;
  while ((match = N_FIELD.exec(text)) !== null) {
    if (match.index > position) break;
    best = match[1];
  }
  return best ?? '?';
}

function processFile(path) {
  const original = readFileSync(path, 'utf8');
  const fixed = [];
  const flagged = [];

  const updated = original.replace(STRING_LITERAL, (literal, offset) => {
    const delim = literal[0];
    const decoded = decodeJsString(literal);
    const result = tryMergeBrokenFences(decoded);

    if (!result.changed) {
      if (result.note) {
        flagged.push({ n: nearestQuestionNumber(original, offset), note: result.note });
      }
      return literal;
    }

    fixed.push({ n: nearestQuestionNumber(original, offset) });
    return encodeJsString(result.value, delim);
  });

  if (fixed.length > 0 && !DRY_RUN) {
    writeFileSync(path, updated, 'utf8');
  }

  return { fixed, flagged };
}

// ---------- 5. Run ----------

const files = discoverExamFiles();
console.log(`Scanning ${files.length} exam file(s)${DRY_RUN ? ' (dry run, no writes)' : ''}...\n`);

let totalFixed = 0;
let totalFlagged = 0;

for (const path of files) {
  const { fixed, flagged } = processFile(path);
  if (fixed.length === 0 && flagged.length === 0) continue;

  console.log(path);
  for (const f of fixed) {
    console.log(`  [fix]   n${f.n}`);
  }
  for (const f of flagged) {
    console.log(`  [skip]  n${f.n} -- ${f.note}`);
  }
  console.log('');

  totalFixed += fixed.length;
  totalFlagged += flagged.length;
}

console.log(
  `Done. ${totalFixed} field(s) merged${DRY_RUN ? ' (dry run -- nothing written)' : ''}, ${totalFlagged} field(s) flagged for manual review.`,
);
if (totalFlagged > 0) {
  console.log('Flagged items were left untouched on purpose -- see the notes above for why.');
}

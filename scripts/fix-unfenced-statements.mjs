/**
 * Finds answer OPTIONS (o[] array elements -- never q or x, which are
 * prose and would flood this with false positives) that read like a
 * complete, self-contained SQL/DDL statement but have zero backticks --
 * i.e. never got wrapped in ``` fences -- and wraps them, matching the
 * convention already used everywhere else in the bank.
 *
 * Deliberately conservative, refined against a manual review pass on
 * the full bank:
 *   - Only scans inside `o: [ ... ]` arrays (tracked structurally via
 *     bracket depth on a string-masked copy of the file, not just
 *     "starts with a keyword" -- that alone matched Spanish explanation
 *     prose and bare matching-quiz labels).
 *   - Reasons per-array in two passes: first checks whether ANY sibling
 *     in the array passes a strict statement check (qualified name,
 *     parens, or semicolon, plus 4+ tokens); if so, the whole array is
 *     treated as a "compare these code snippets" question and every
 *     zero-backtick, SQL-keyword-led sibling gets fenced -- even ones
 *     that individually lack that extra punctuation. Without this,
 *     partial application within one question (some options fenced,
 *     others not) would introduce a new inconsistency.
 *   - Excludes a trailing all-caps acronym gloss like "(CTAS)" --
 *     that's a label, not SQL syntax.
 *   - Excludes common prose phrasing ("does not support", "instead",
 *     "in order to", etc.) that can slip past the syntax checks above.
 *
 * On a full-bank run during development this brought 145 raw regex
 * matches down to 9 array-qualifying candidates, of which 2 were still
 * false positives caught only by reading the actual question context by
 * hand -- both patterns are now excluded by the two rules above. Given
 * the sensitivity of this data, skim the console output after running.
 *
 * Usage:
 *   node scripts/fix-unfenced-statements.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = 'src/quiz/data';

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
      else out += next;
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

function maskStrings(text) {
  return text.replace(STRING_LITERAL, (m) => m[0] + ' '.repeat(m.length - 2) + m[0]);
}

function findOptionArrayRanges(masked) {
  const ranges = [];
  const OPEN = /\bo:\s*\[/g;
  let m;
  while ((m = OPEN.exec(masked)) !== null) {
    const start = m.index;
    let depth = 1;
    let i = OPEN.lastIndex;
    while (i < masked.length && depth > 0) {
      if (masked[i] === '[') depth++;
      else if (masked[i] === ']') depth--;
      i++;
    }
    ranges.push([start, i]);
  }
  return ranges;
}

const SQL_LEAD =
  /^(SELECT|CREATE|ALTER|DROP|GRANT|REVOKE|DENY|SHOW|MERGE|INSERT|UPDATE|DELETE|WITH|USE|DESCRIBE|EXPLAIN|OPTIMIZE|VACUUM|RESTORE|CLONE|SET|COPY INTO|AUTO CDC INTO|APPLY CHANGES INTO|CREATE OR REFRESH|CREATE OR REPLACE|COMMENT ON)\b/;

// A trailing all-caps parenthetical like "(CTAS)" is an acronym gloss on
// a label, not SQL syntax -- e.g. "CREATE TABLE AS SELECT (CTAS)" used
// as a matching-quiz option, not a real statement.
const ACRONYM_GLOSS = /\([A-Z]{2,6}\)\s*$/;

// Common English prose phrasing that can slip past the syntax checks
// below (e.g. a semicolon inside an ordinary sentence).
const PROSE_PHRASING =
  /\b(does not|did not|is not able|instead|only works|no longer|in order to|use \w+ instead)\b/i;

function looksLikeStatementCore(text) {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.includes('`')) return false;
  if (trimmed.includes('\n')) return false;
  if (!SQL_LEAD.test(trimmed)) return false;
  if (ACRONYM_GLOSS.test(trimmed)) return false;
  if (PROSE_PHRASING.test(trimmed)) return false;
  return true;
}

// Strict check: used to decide whether an ARRAY qualifies as a
// "compare these code snippets" question in the first place.
function looksLikeUnfencedStatement(text) {
  if (!looksLikeStatementCore(text)) return false;
  const trimmed = text.trim();
  const hasQualifiedName = /\b[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*\b/.test(trimmed);
  const hasParens = trimmed.includes('(');
  const hasSemicolon = trimmed.includes(';');
  const tokenCount = trimmed.split(/\s+/).length;
  if (!(hasQualifiedName || hasParens || hasSemicolon) || tokenCount < 4) return false;
  return true;
}

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
  const masked = maskStrings(original);
  const optionRanges = findOptionArrayRanges(masked);
  const fixed = [];

  const matches = [];
  let m;
  STRING_LITERAL.lastIndex = 0;
  while ((m = STRING_LITERAL.exec(original)) !== null) {
    matches.push({ literal: m[0], offset: m.index });
  }

  const qualifiesByRange = new Map();
  for (let r = 0; r < optionRanges.length; r++) {
    const [start, end] = optionRanges[r];
    const inRange = matches.filter((x) => x.offset >= start && x.offset < end);
    const qualifies = inRange.some((x) => looksLikeUnfencedStatement(decodeJsString(x.literal)));
    qualifiesByRange.set(r, qualifies);
  }

  function rangeIndexFor(offset) {
    for (let r = 0; r < optionRanges.length; r++) {
      const [start, end] = optionRanges[r];
      if (offset >= start && offset < end) return r;
    }
    return -1;
  }

  const updated = original.replace(STRING_LITERAL, (literal, offset) => {
    const r = rangeIndexFor(offset);
    if (r === -1 || !qualifiesByRange.get(r)) return literal;

    const delim = literal[0];
    const decoded = decodeJsString(literal);
    if (!looksLikeStatementCore(decoded)) return literal;

    fixed.push({ n: nearestQuestionNumber(original, offset), text: decoded });
    const wrapped = '```\n' + decoded + '\n```';
    return encodeJsString(wrapped, delim);
  });

  if (fixed.length > 0) {
    writeFileSync(path, updated, 'utf8');
  }
  return fixed;
}

const files = discoverExamFiles();
let total = 0;

for (const path of files) {
  const fixed = processFile(path);
  if (fixed.length === 0) continue;

  console.log(path);
  for (const f of fixed) {
    console.log(`  [fenced] n${f.n}: ${f.text}`);
  }
  console.log('');
  total += fixed.length;
}

console.log(`Done. ${total} option(s) fenced.`);

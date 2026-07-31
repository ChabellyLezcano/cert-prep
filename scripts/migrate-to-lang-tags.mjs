/**
 * One-time migration: converts every ```fenced``` code block and every
 * `single-backtick` inline span, across every exam file in every
 * certification, into the new `lang*...*lang` tag mechanism (see
 * TAG_LANGUAGE and splitLangTags in src/quiz/components/QuestionCard.tsx
 * for the renderer side of this).
 *
 * Language is resolved with the EXACT same heuristic QuestionCard.tsx
 * uses at render time (detectLanguage's pattern checks, then
 * highlightAuto restricted to the same 5-language subset, same
 * relevance>=3 confidence floor) -- so the migration reproduces whatever
 * is already being displayed today, just baked into the data as an
 * explicit tag instead of guessed on every render. On top of that, any
 * content classified as 'python' that also looks like PySpark (spark./
 * dbutils./pyspark) is tagged 'spark' instead, for authoring clarity --
 * both highlight identically (spark has no separate hljs grammar).
 *
 * Block vs inline is preserved via the same signal the old ```/`
 * split used to carry implicitly: a fenced block becomes
 * `lang*\n<content>\n*lang` (padded -- renders as a full code box even
 * if it's a single physical line, matching today's behavior for
 * single-line SQL statements that were deliberately fenced rather than
 * left as an inline mention); an inline span becomes `lang*<content>*lang`
 * (no padding, no newlines possible by construction -- renders as a
 * small monospace pill, exactly like today).
 *
 * Escaping: the single-backtick regex tolerates a backslash-escaped
 * backtick inside (`\``) -- the workaround previously needed so a
 * literal backtick inside the span (e.g. Databricks' own
 * `` `/Volumes/...` `` path-quoting syntax) wouldn't prematurely close
 * it. That escaping is no longer needed under the new mechanism (`lang*`
 * isn't a character Databricks SQL uses), so it's unescaped back to a
 * plain backtick as part of the conversion.
 *
 * Safety: before wrapping any content in `lang*...*lang`, checks the
 * content doesn't already contain that exact delimiter substring
 * ("lang*" or "*lang") -- vanishingly unlikely in real code, but would
 * corrupt parsing if it happened, so those (if any) are skipped and
 * reported instead of silently applied.
 *
 * Comment safety: string-literal scanning runs against a copy of the
 * file with // and /* *‍/ comments masked to spaces first -- otherwise a
 * plain apostrophe used as punctuation inside a comment (e.g. "AWS
 * SAA's exam") gets misread as a quote character, and the scanner
 * happily reads forward across real newlines looking for the next one,
 * silently merging multiple comment lines into a single "string" and
 * corrupting them on write-back. Caught this exact case against this
 * bank's own file headers during testing.
 *
 * Usage:
 *   node scripts/migrate-to-lang-tags.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';

// ---------- Replicate QuestionCard.tsx's hljs setup exactly ----------

const DATABRICKS_SQL_KEYWORDS = [
  'vacuum',
  'optimize',
  'restore',
  'zorder',
  'clone',
  'pivot',
  'unpivot',
  'deny',
  'streaming',
  'tblproperties',
  'expect',
  'expectation',
  'location',
  'comment',
  'refresh',
  'live',
  'materialized',
  'catalog',
  'metastore',
  'workspace',
  'cluster',
  'warehouse',
  'pipeline',
  'lakehouse',
  'delta',
  'json',
  'csv',
  'binaryfile',
  'cloudfiles',
  'readstream',
  'writestream',
  'checkpoint',
  'shallow',
  'deep',
  'recipient',
  'share',
  'privileges',
  'usage',
  'ownership',
  'tag',
  'volume',
  'schema',
  'widget',
  'notebook',
  'dashboard',
  'alert',
  'endpoint',
  'serverless',
  'photon',
  'autoloader',
  'cron',
  'cascade',
  'struct',
];
hljs.registerLanguage('sql', (hljsInstance) => {
  const definition = sql(hljsInstance);
  const doubleQuoteMode = definition.contains?.find(
    (mode) => mode.begin instanceof RegExp && mode.begin.source === '"' && !mode.scope && !mode.className,
  );
  if (doubleQuoteMode) doubleQuoteMode.scope = 'string';
  const { keywords } = definition;
  if (
    keywords &&
    typeof keywords === 'object' &&
    !Array.isArray(keywords) &&
    Array.isArray(keywords.keyword)
  ) {
    keywords.keyword.push(...DATABRICKS_SQL_KEYWORDS);
  }
  return definition;
});
hljs.registerLanguage('python', python);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
const CODE_LANGUAGE_SUBSET = ['sql', 'python', 'yaml', 'bash', 'json'];

const CLI_BINARIES = new Set([
  'databricks',
  'aws',
  'az',
  'gcloud',
  'git',
  'pip',
  'pip3',
  'curl',
  'docker',
  'kubectl',
  'spark-submit',
  'npm',
  'npx',
  'conda',
  'terraform',
  'ssh',
  'scp',
  'wget',
]);
const YAML_LINE = /^\s*(-\s+)?[\w.${}-]+:(\s|$)/;
const PYTHON_HINTS = /^\s*(import |from \S+ import |def |@\w|spark\.|dbutils\.)/m;
const PYSPARK_CHAIN = /\.option\(|\.readStream|\.writeStream|\b\w*[Dd]f\.\w+\(|\bWindow\./;
const SPARK_REFINEMENT = /spark\.|dbutils\.|pyspark/i;
const SQL_STATEMENT_STARTS = new Set([
  'select',
  'create',
  'alter',
  'drop',
  'show',
  'describe',
  'desc',
  'grant',
  'revoke',
  'deny',
  'insert',
  'update',
  'delete',
  'merge',
  'copy',
  'use',
  'set',
  'vacuum',
  'optimize',
  'restore',
  'comment',
  'with',
  'explain',
  'truncate',
  'refresh',
  'call',
  'declare',
  'analyze',
  'msck',
  'cache',
  'uncache',
  'reset',
  'add',
  'apply',
  'pivot',
  'unpivot',
  'auto',
  'convert',
  'rollback',
]);
const SQL_HINTS =
  /\b(SELECT|CREATE\s+(OR\s+REPLACE\s+)?(TABLE|STREAMING TABLE|VIEW)|ALTER\s+TABLE|GRANT|REVOKE|INSERT\s+INTO|COPY\s+INTO|MERGE\s+INTO|FROM\s+\w|WHERE\s)\b/i;

function detectLanguage(content) {
  const trimmed = content.trim();
  const lines = trimmed.split('\n').filter((l) => l.trim().length > 0);
  if (!lines.length) return null;

  const firstWord = lines[0]
    .trim()
    .split(/\s+/)[0]
    .replace(/^[$#>]\s*/, '');
  if (CLI_BINARIES.has(firstWord)) return 'bash';
  if (SQL_STATEMENT_STARTS.has(firstWord.toLowerCase())) return 'sql';

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  if ((firstChar === '{' && lastChar === '}') || (firstChar === '[' && lastChar === ']')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // fall through
    }
  }

  const yamlLikeCount = lines.filter((l) => YAML_LINE.test(l)).length;
  if (yamlLikeCount / lines.length >= 0.6 && !trimmed.includes(';')) return 'yaml';

  if (PYTHON_HINTS.test(trimmed) || PYSPARK_CHAIN.test(trimmed)) return 'python';

  if (SQL_HINTS.test(trimmed)) return 'sql';

  return null;
}

function resolveLanguage(content) {
  const forced = detectLanguage(content);
  let lang = forced;
  if (!lang) {
    try {
      const auto = hljs.highlightAuto(content, CODE_LANGUAGE_SUBSET);
      if (auto.language && auto.relevance >= 3) lang = auto.language;
    } catch {
      // leave lang null
    }
  }
  if (lang === 'python' && SPARK_REFINEMENT.test(content)) lang = 'spark';
  return lang ?? 'code';
}

// ---------- File discovery (same globs as bank.ts) ----------

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

// ---------- JS string-literal tokenizer (comment-aware) ----------

function maskComments(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const two = text.slice(i, i + 2);
    if (two === '//') {
      let j = i;
      while (j < text.length && text[j] !== '\n') j++;
      out += ' '.repeat(j - i);
      i = j;
      continue;
    }
    if (two === '/*') {
      let j = i + 2;
      while (j < text.length && text.slice(j, j + 2) !== '*/') j++;
      j = Math.min(j + 2, text.length);
      out += text.slice(i, j).replace(/[^\n]/g, ' ');
      i = j;
      continue;
    }
    if (text[i] === "'" || text[i] === '"') {
      const quote = text[i];
      let j = i + 1;
      while (j < text.length) {
        if (text[j] === '\\') {
          j += 2;
          continue;
        }
        if (text[j] === quote) {
          j++;
          break;
        }
        j++;
      }
      out += text.slice(i, j);
      i = j;
      continue;
    }
    out += text[i];
    i++;
  }
  return out;
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

// ---------- The actual field-text migration ----------

const FENCE = /```[a-zA-Z]*\n?([\s\S]*?)```/g;
const INLINE = /`((?:\\`|[^`\n])+)`/g;

function hasDelimiterCollision(content, lang) {
  return content.includes(lang + '*') || content.includes('*' + lang);
}

function migrateFieldText(value) {
  const warnings = [];

  let afterFences = '';
  let lastIndex = 0;
  let m;
  FENCE.lastIndex = 0;
  while ((m = FENCE.exec(value)) !== null) {
    afterFences += value.slice(lastIndex, m.index);
    const inner = m[1].replace(/\n$/, '');
    const lang = resolveLanguage(inner);
    if (hasDelimiterCollision(inner, lang)) {
      warnings.push(`fenced block contains "${lang}*" or "*${lang}" -- left as-is: ${inner.slice(0, 60)}...`);
      afterFences += m[0];
    } else {
      afterFences += `${lang}*\n${inner}\n*${lang}`;
    }
    lastIndex = FENCE.lastIndex;
  }
  afterFences += value.slice(lastIndex);

  let result = '';
  lastIndex = 0;
  INLINE.lastIndex = 0;
  while ((m = INLINE.exec(afterFences)) !== null) {
    result += afterFences.slice(lastIndex, m.index);
    const inner = m[1].replace(/\\`/g, '`');
    const lang = resolveLanguage(inner);
    if (hasDelimiterCollision(inner, lang)) {
      warnings.push(`inline span contains "${lang}*" or "*${lang}" -- left as-is: ${inner.slice(0, 60)}`);
      result += m[0];
    } else {
      result += `${lang}*${inner}*${lang}`;
    }
    lastIndex = INLINE.lastIndex;
  }
  result += afterFences.slice(lastIndex);

  return { text: result, warnings, changed: result !== value };
}

// ---------- Apply across a file ----------

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
  const masked = maskComments(original);

  const literalMatches = [];
  let m;
  STRING_LITERAL.lastIndex = 0;
  while ((m = STRING_LITERAL.exec(masked)) !== null) {
    literalMatches.push({ index: m.index, text: m[0] });
  }

  let migratedCount = 0;
  const allWarnings = [];
  let result = '';
  let cursor = 0;

  for (const { index, text: literalFromMasked } of literalMatches) {
    result += original.slice(cursor, index);
    const literalFromOriginal = original.slice(index, index + literalFromMasked.length);
    cursor = index + literalFromMasked.length;

    if (literalFromOriginal !== literalFromMasked) {
      result += literalFromOriginal;
      continue;
    }

    const delim = literalFromOriginal[0];
    const decoded = decodeJsString(literalFromOriginal);
    if (!decoded.includes('```') && !decoded.includes('`')) {
      result += literalFromOriginal;
      continue;
    }

    const { text, warnings, changed } = migrateFieldText(decoded);
    for (const w of warnings) allWarnings.push(`  n${nearestQuestionNumber(original, index)}: ${w}`);
    if (!changed) {
      result += literalFromOriginal;
      continue;
    }

    migratedCount++;
    result += encodeJsString(text, delim);
  }
  result += original.slice(cursor);

  if (migratedCount > 0) {
    writeFileSync(path, result, 'utf8');
  }
  return { migratedCount, warnings: allWarnings };
}

// ---------- Run ----------

const files = discoverExamFiles();
console.log(`Scanning ${files.length} exam file(s)...\n`);

let totalFields = 0;
let totalWarnings = 0;

for (const path of files) {
  const { migratedCount, warnings } = processFile(path);
  if (migratedCount === 0 && warnings.length === 0) continue;

  console.log(path);
  if (migratedCount > 0) console.log(`  ${migratedCount} field(s) migrated`);
  for (const w of warnings) console.log(w);
  console.log('');

  totalFields += migratedCount;
  totalWarnings += warnings.length;
}

console.log(
  `Done. ${totalFields} field(s) migrated across ${files.length} file(s), ${totalWarnings} warning(s).`,
);
if (totalWarnings > 0) {
  console.log(
    'Fields with warnings were left untouched (still using the old ```/` markup) -- review them by hand.',
  );
}

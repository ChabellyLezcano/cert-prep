import { Fragment, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import hljs from 'highlight.js/lib/core';
import sql from 'highlight.js/lib/languages/sql';
import python from 'highlight.js/lib/languages/python';
import yaml from 'highlight.js/lib/languages/yaml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import 'highlight.js/styles/vs2015.css';
import { getDomain } from '../data/domains';
import { Highlight } from '../../shared/components/Highlight';
import { Button } from '../../shared/components/Button';
import { shuffleIndices } from '../../shared/utils/shuffle';
import { useLocale } from '../../shared/i18n/useLocale';
import type { Question, QuestionProgress } from '../quiz.types';

// Registered once at module load. Covers every language actually used by
// the exam bank and by AI-generated questions (PySpark reads as python,
// Databricks CLI/bash reads as bash, DAB config reads as yaml).
// Databricks/Delta-specific vocabulary the bundled ANSI-SQL grammar
// doesn't recognize as keywords, so it'd otherwise render as plain
// uncolored text even though it's central to this exam bank's content.
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
  // The bundled grammar's double-quoted-text mode has no `scope`, so it
  // renders completely unstyled -- strictly correct per ANSI SQL (double
  // quotes there are identifiers, not string literals), but Databricks
  // SQL commonly accepts double quotes for string literals too, and a lot
  // of this bank's own questions use them that way. Left unpatched,
  // otherwise-identical code renders with visibly inconsistent coloring
  // purely based on which quote character the author happened to use.
  // Give it the same "string" scope as the single-quote mode so both
  // render identically.
  const doubleQuoteMode = definition.contains?.find(
    (mode): mode is typeof mode & { begin: RegExp } =>
      mode.begin instanceof RegExp && mode.begin.source === '"' && !mode.scope && !mode.className,
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

// hljs.highlightAuto guesses purely from grammar-token overlap, which is
// unreliable on short snippets: single-line CLI commands like
// "databricks bundle deploy --target prod" score higher against SQL's
// grammar than bash's (no real bash-specific tokens to match), so they'd
// render with wrong SQL coloring. These heuristics catch the exam bank's
// actual patterns (verified against real questions in exams/*.ts) before
// falling back to highlightAuto, and are checked in a fixed order because
// a snippet can superficially match more than one (e.g. a YAML value
// containing the word "from").
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
const PYSPARK_CHAIN = /\.option\(|\.readStream|\.writeStream/;
// Every SQL statement keyword actually used to *open* a snippet across
// this exam bank. Checked against the first word rather than searched for
// anywhere in the content (unlike SQL_HINTS below) because that's cheap,
// unambiguous, and covers commands like SHOW/DESCRIBE/DROP/USE/SET/VACUUM
// that don't otherwise contain any of SQL_HINTS's substrings -- those
// used to fall through to highlightAuto, which often guesses 'sql'
// correctly but with relevance too low to pass the confidence floor
// below, rendering as plain unstyled text instead.
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
]);
const SQL_HINTS =
  /\b(SELECT|CREATE\s+(OR\s+REPLACE\s+)?(TABLE|STREAMING TABLE|VIEW)|ALTER\s+TABLE|GRANT|REVOKE|INSERT\s+INTO|COPY\s+INTO|MERGE\s+INTO|FROM\s+\w|WHERE\s)\b/i;

/** Returns a forced language when a snippet matches a known, unambiguous
 * pattern from the exam bank; null lets the caller fall back to
 * highlightAuto (and from there, to plain unstyled text if that's also
 * low-confidence -- better to show correct-looking plain code than
 * confidently wrong colors). */
function detectLanguage(content: string): string | null {
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
      // Looks JSON-shaped but doesn't actually parse (e.g. a Python dict
      // literal with single quotes) -- fall through to the other checks
      // instead of forcing json highlighting on it.
    }
  }

  const yamlLikeCount = lines.filter((l) => YAML_LINE.test(l)).length;
  if (yamlLikeCount / lines.length >= 0.6 && !trimmed.includes(';')) return 'yaml';

  if (PYTHON_HINTS.test(trimmed) || PYSPARK_CHAIN.test(trimmed)) return 'python';

  if (SQL_HINTS.test(trimmed)) return 'sql';

  return null;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

interface QuestionCardProps {
  question: Question;
  entry: QuestionProgress | undefined;
  searchTerm: string;
  onGrade: (question: Question, picked: number[]) => void;
  onReveal: (question: Question) => void;
  onRetry: (questionId: string) => void;
  /** Extra badge shown in the tag row, e.g. "Generada por IA". */
  badge?: React.ReactNode;
  /** Extra controls shown alongside Show answer/Retry, e.g. save/remove favorite. */
  extraActions?: React.ReactNode;
}

export function QuestionCard({
  question,
  entry,
  searchTerm,
  onGrade,
  onReveal,
  onRetry,
  badge,
  extraActions,
}: QuestionCardProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const { t } = useLocale();
  const domain = getDomain(question.certId, question.d);
  const isMulti = question.m === 1;
  const isAnswered = Boolean(entry);

  // Randomizes only the DISPLAY order of options. Every value derived from
  // this — toggleOption, optionState, entry.picked, question.a — still
  // refers to the option's ORIGINAL index, so grading logic is completely
  // unaffected; only the visual position (and A/B/C/D label) changes.
  // Memoized by question.id so the order stays put across re-renders
  // (e.g. right after grading) instead of reshuffling on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- question.id isn't read inside shuffleIndices, but it's the real trigger for reshuffling: without it, two consecutive questions with the same option count would incorrectly keep the same shuffle order.
  const displayOrder = useMemo(() => shuffleIndices(question.o.length), [question.id, question.o.length]);

  function toggleOption(index: number) {
    if (isAnswered) return;
    if (isMulti) {
      setSelected((prev) => (prev.includes(index) ? prev.filter((v) => v !== index) : [...prev, index]));
    } else {
      onGrade(question, [index]);
    }
  }

  function submitMultiSelect() {
    if (!selected.length) return;
    onGrade(question, selected);
  }

  function handleRetry() {
    setSelected([]);
    onRetry(question.id);
  }

  const cardTone = !entry
    ? ''
    : entry.revealed
      ? 'border-ink-200'
      : entry.ok
        ? 'border-ok-500/50'
        : 'border-ko-500/50';

  return (
    <article
      className={`min-w-0 rounded-2xl border bg-surface p-5 shadow-sm transition ${cardTone || 'border-ink-100'}`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="max-w-full break-words rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
          {domain ? (
            <>
              S{domain.order} · {domain.name}
            </>
          ) : (
            question.d
          )}
        </span>
        {question.exam > 0 && (
          <span className="rounded-full bg-ink-50 px-2.5 py-1 text-xs font-medium text-ink-500">
            {t('question.examQ', { exam: question.exam, n: question.n })}
          </span>
        )}
        {badge}
        {isMulti && (
          <span className="rounded-full bg-accent-400/30 px-2.5 py-1 text-xs font-semibold text-accent-600">
            {t('question.multiAnswer')}
          </span>
        )}
      </div>

      <div className="min-w-0 whitespace-pre-line break-words text-[15px] leading-relaxed text-ink-800">
        <TextWithCode text={question.q} searchTerm={searchTerm} />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {displayOrder.map((originalIndex, position) => (
          <OptionButton
            key={originalIndex}
            letter={OPTION_LETTERS[position]}
            text={question.o[originalIndex]}
            searchTerm={searchTerm}
            state={optionState(question, entry, selected, originalIndex)}
            disabled={isAnswered}
            onClick={() => toggleOption(originalIndex)}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!entry && isMulti && (
          <>
            <Button onClick={submitMultiSelect} disabled={!selected.length}>
              {t('question.checkSelection')}
            </Button>
            <span className="text-xs text-ink-400">{t('question.chooseN', { n: question.a.length })}</span>
            <Button variant="ghost" onClick={() => onReveal(question)}>
              {t('question.showAnswer')}
            </Button>
          </>
        )}
        {!entry && !isMulti && (
          <Button variant="ghost" onClick={() => onReveal(question)}>
            {t('question.showAnswer')}
          </Button>
        )}
        {entry && (
          <>
            <Verdict entry={entry} />
            <Button variant="ghost" onClick={handleRetry}>
              {t('question.retry')}
            </Button>
          </>
        )}
        {extraActions}
      </div>

      {entry && (
        <div className="mt-4 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-400">
            {t('question.explanationLabel')}
          </span>
          <div className="min-w-0 break-words">
            <TextWithCode text={question.x} searchTerm={searchTerm} />
          </div>
        </div>
      )}
    </article>
  );
}

function Verdict({ entry }: { entry: QuestionProgress }) {
  const { t } = useLocale();
  if (entry.revealed) {
    return <span className="text-sm font-semibold text-ink-500">{t('question.answerRevealed')}</span>;
  }
  return entry.ok ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ok-600">
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {t('question.correct')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ko-600">
      <XCircle className="h-4 w-4" aria-hidden="true" />
      {t('question.incorrect')}
    </span>
  );
}

type OptionVisualState = 'default' | 'selected' | 'correct' | 'incorrect';

function optionState(
  question: Question,
  entry: QuestionProgress | undefined,
  selected: number[],
  index: number,
): OptionVisualState {
  if (entry) {
    if (question.a.includes(index)) return 'correct';
    if (entry.picked.includes(index)) return 'incorrect';
    return 'default';
  }
  return selected.includes(index) ? 'selected' : 'default';
}

const OPTION_CLASSES: Record<OptionVisualState, string> = {
  default: 'border-ink-200 hover:border-brand-300 hover:bg-brand-50/40',
  selected: 'border-brand-500 bg-brand-50',
  correct: 'border-ok-500 bg-ok-100',
  incorrect: 'border-ko-500 bg-ko-100',
};

function OptionButton({
  letter,
  text,
  searchTerm,
  state,
  disabled,
  onClick,
}: {
  letter: string;
  text: string;
  searchTerm: string;
  state: OptionVisualState;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition disabled:cursor-default ${OPTION_CLASSES[state]}`}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[11px] font-bold">
        {letter}
      </span>
      <span className="min-w-0 whitespace-pre-line break-words text-ink-700">
        <TextWithCode text={text} searchTerm={searchTerm} />
      </span>
    </button>
  );
}

/** Splits text on fenced code blocks (```...```), rendering fenced parts
 * as a monospace code box and everything else as normal prose (still
 * passed through Highlight for search-term matching). Text with no
 * fences renders exactly as before -- this is why none of your existing
 * bank questions change: they've never used the ``` convention, only the
 * study guide topics have. New AI-generated questions are prompted to use
 * ``` around real code/config snippets, so this only activates there. */
function splitCodeBlocks(text: string): { type: 'text' | 'code'; content: string }[] {
  const fenceRegex = /```[a-zA-Z]*\n?([\s\S]*?)```/g;
  const segments: { type: 'text' | 'code'; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'code', content: match[1].replace(/\n$/, '') });
    lastIndex = fenceRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments;
}

/** Splits a plain-text (non-fenced) segment on single-backtick inline code
 * spans (`like this`) -- the convention actually used across the exam
 * bank for short snippets (`spark.sql()`, `%sql`, table/file paths, config
 * keys) that appear inline in a sentence rather than as a standalone
 * block. Deliberately excludes newlines from the match so it can't
 * accidentally swallow an unrelated stray backtick several lines later. */
function splitInlineCode(text: string): { type: 'text' | 'inline-code'; content: string }[] {
  const inlineRegex = /`([^`\n]+)`/g;
  const segments: { type: 'text' | 'inline-code'; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: 'inline-code', content: match[1] });
    lastIndex = inlineRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return segments;
}

/** Renders a non-fenced text segment, styling any single-backtick inline
 * code spans as a small monospace pill and passing everything else
 * through Highlight for search-term matching. */
function TextWithInlineCode({ text, searchTerm }: { text: string; searchTerm: string }) {
  const segments = useMemo(() => splitInlineCode(text), [text]);

  if (segments.length === 1 && segments[0].type === 'text') {
    return <Highlight text={text} term={searchTerm} />;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.type === 'inline-code' ? (
          <code
            key={index}
            className="rounded-md bg-ink-100 px-1.5 py-0.5 font-mono text-[0.85em] text-ink-700"
          >
            {segment.content}
          </code>
        ) : (
          <Fragment key={index}>
            <Highlight text={segment.content} term={searchTerm} />
          </Fragment>
        ),
      )}
    </>
  );
}

/** Renders a fenced code block with real syntax highlighting (auto-detected
 * among the languages actually used in this exam bank/AI generation:
 * SQL, PySpark/Python, YAML, CLI/bash), styled with the vs2015 theme --
 * the closest highlight.js theme to VS Code's Dark+ palette. Falls back
 * to plain escaped text if highlighting throws for any reason, so a
 * malformed snippet never breaks the whole question card. */
interface HighlightResult {
  html: string;
  /** Resolved language, or null when confidence was too low and we fell
   * back to plain escaped text. Surfaced as a `language-xxx` class on the
   * rendered <code> element (standard convention, and lets tests assert
   * on detection without parsing hljs's internal span markup). */
  language: string | null;
}

/** Highlights a code snippet: tries the pattern heuristics first, then
 * highlightAuto above a relevance floor, then falls back to plain escaped
 * text. Kept outside the component (as a plain, non-hook function) so
 * useMemo's callback body stays trivial for the React Compiler. */
function highlightContent(content: string): HighlightResult {
  try {
    const forced = detectLanguage(content);
    if (forced) {
      return { html: hljs.highlight(content, { language: forced }).value, language: forced };
    }
    // No confident heuristic match: let highlightAuto guess, but only
    // trust it above a relevance floor. Below that, a guess is more
    // likely wrong than right on short snippets, so plain (but still
    // correctly boxed/escaped) text beats confidently-wrong coloring.
    const auto = hljs.highlightAuto(content, CODE_LANGUAGE_SUBSET);
    if (!auto.language || auto.relevance < 3) {
      return { html: escapeHtml(content), language: null };
    }
    return { html: auto.value, language: auto.language };
  } catch {
    return { html: escapeHtml(content), language: null };
  }
}

/** hljs's output is a flat run of `<span class="...">...</span>` tags (it
 * never emits anything else -- no self-closing tags, no other elements),
 * so splitting it into one HTML string per source line is a matter of
 * tracking which spans are still open at each `\n`: close them all before
 * the break, and reopen the same tags right after it. Naive splitting on
 * `\n` would otherwise leave a span opened on one line and closed on a
 * later one, corrupting every line in between once rendered separately
 * (each line needs to be independently valid HTML, since line numbers
 * render one line per row). */
function splitHighlightedHtmlByLine(html: string): string[] {
  const lines: string[] = [];
  const openTags: string[] = [];
  let current = '';
  let i = 0;

  while (i < html.length) {
    const char = html[i];
    if (char === '<') {
      const tagEnd = html.indexOf('>', i);
      if (tagEnd === -1) {
        current += html.slice(i);
        break;
      }
      const tag = html.slice(i, tagEnd + 1);
      if (tag.startsWith('</')) {
        openTags.pop();
      } else {
        openTags.push(tag);
      }
      current += tag;
      i = tagEnd + 1;
    } else if (char === '\n') {
      current += '</span>'.repeat(openTags.length);
      lines.push(current);
      current = openTags.join('');
      i += 1;
    } else {
      current += char;
      i += 1;
    }
  }
  current += '</span>'.repeat(openTags.length);
  lines.push(current);
  return lines;
}

function CodeBlock({ content }: { content: string }) {
  const { html, language } = useMemo(() => highlightContent(content), [content]);
  const lines = useMemo(() => splitHighlightedHtmlByLine(html), [html]);
  // ch is the width of one monospace digit; sized to the widest line
  // number so e.g. a 12-line block doesn't get a gutter wide enough for 3
  // digits.
  const gutterWidth = `${String(lines.length).length + 1}ch`;

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-black/40 bg-[#1e1e1e]">
      <pre className="overflow-x-hidden text-[13px] leading-relaxed sm:text-xs">
        {/* hljs escapes the source itself; this only ever renders its own highlighted-span markup, never raw user HTML */}
        <code className={`hljs block font-mono ${language ? `language-${language}` : ''}`}>
          {lines.map((lineHtml, index) => (
            <div key={index} className="flex">
              <span
                className="select-none pr-3 text-right text-white/25"
                style={{ minWidth: gutterWidth }}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              {/* min-w-0 lets this shrink below its content's natural width
               * inside the flex row, which is what actually lets
               * whitespace-pre-wrap/break-words wrap long lines instead of
               * pushing the row wider than the card -- without it, a flex
               * item's default min-width:auto overrides the wrap entirely. */}
              <span
                className="min-w-0 flex-1 whitespace-pre-wrap break-words"
                // Always render at least a space so an empty source line
                // still occupies a row instead of collapsing to 0 height.
                dangerouslySetInnerHTML={{ __html: lineHtml || ' ' }}
              />
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

function TextWithCode({ text, searchTerm }: { text: string; searchTerm: string }) {
  const segments = useMemo(() => splitCodeBlocks(text), [text]);

  // Common case, zero fences and zero inline backticks: render exactly as
  // the old plain <Highlight> call did, no wrapper overhead.
  if (segments.length === 1 && segments[0].type === 'text' && !segments[0].content.includes('`')) {
    return <Highlight text={text} term={searchTerm} />;
  }

  return (
    <>
      {segments.map((segment, index) =>
        segment.type === 'code' ? (
          <CodeBlock key={index} content={segment.content} />
        ) : (
          <TextWithInlineCode key={index} text={segment.content} searchTerm={searchTerm} />
        ),
      )}
    </>
  );
}

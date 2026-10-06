export interface ParsedQuestion {
  n: number;
  domain: string;
  multi: boolean;
  question: string;
  options: string[];
  answers: number[];
  explanation: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  /** Question numbers whose correct answer could not be determined with confidence. */
  unresolved: number[];
  /** Question numbers that could not be split into stem, options and explanation. */
  malformed: number[];
}

const HEADER = /^\s*(\d+)\.\s+Question\s*$/;
const STATE_LINE = /^\s*(Unattempted|Skipped)\s*$/;
const FOOTER = /^\s*(Use Page numbers below|Pages:)/;
const LETTERED = /^\s*([A-E])[.)]\s+(.*\S)\s*$/;
const MULTI_HINT = /\b(choose|select)\s+(two|2|three|3)\b/i;
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  SEC: [
    'iam',
    'kms',
    'encrypt',
    'security group',
    'privatelink',
    'vpc endpoint',
    'waf',
    'shield',
    'cloudtrail',
    'guardduty',
    'macie',
    'cognito',
    'secrets manager',
    'presigned',
    'bucket policy',
    'mfa',
    'private subnet',
    'secure',
  ],
  RES: [
    'multi-az',
    'availability zone',
    'failover',
    'replica',
    'backup',
    'snapshot',
    'disaster',
    'high availability',
    'highly available',
    'auto scaling',
    'sqs',
    'sns',
    'decouple',
    'route 53',
    'health check',
    'versioning',
  ],
  PERF: [
    'cloudfront',
    'elasticache',
    'cache',
    'iops',
    'performance',
    'latency',
    'global accelerator',
    'dax',
    'placement group',
    'throughput',
    'edge location',
  ],
  COST: [
    'cost',
    'cheapest',
    'cost-effective',
    'glacier',
    'spot',
    'reserved',
    'savings plan',
    'lifecycle',
    'intelligent-tiering',
    'infrequent access',
  ],
};

const NBSP = /\u00a0/g;
const normalize = (text: string) =>
  text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d"'`.,;:!?()\u2011-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function classifyDomain(text: string): string {
  const haystack = text.toLowerCase();
  let best = 'RES';
  let bestScore = 0;
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const score = keywords.reduce((sum, kw) => sum + (haystack.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) {
      best = domain;
      bestScore = score;
    }
  }
  return best;
}

function splitOptions(pre: string[], explanation: string, stemHint: string) {
  const lines = pre.map((l) => l.trim()).filter(Boolean);

  const lettered: { index: number; text: string }[] = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = LETTERED.exec(lines[i]!);
    if (!match) break;
    lettered.unshift({ index: i, text: match[2]! });
  }
  if (lettered.length >= 2) {
    return { stem: lines.slice(0, lettered[0]!.index), options: lettered.map((l) => l.text) };
  }

  const letters = [...explanation.matchAll(/Option\s+([A-E])\b/g)].map((m) => 'ABCDE'.indexOf(m[1]!));
  const count = Math.max(MULTI_HINT.test(stemHint) ? 5 : 4, ...letters.map((i) => i + 1));
  if (lines.length <= count) return null;
  const options = lines.slice(-count).map((l) => l.replace(/^[A-E][.)]\s+/, ''));
  return { stem: lines.slice(0, lines.length - count), options };
}

function findCorrectIndexes(explanation: string, options: string[]): number[] {
  const cuts = [
    explanation.search(/^\s*Incorrect\b/im),
    explanation.search(/Why Other Options Are Incorrect/i),
  ].filter((i) => i !== -1);
  const cut = cuts.length ? Math.min(...cuts) : -1;
  const correctPart = cut === -1 ? explanation : explanation.slice(0, cut);

  const letters = new Set(
    [...correctPart.matchAll(/Option\s+([A-E])\b/g)]
      .map((m) => 'ABCDE'.indexOf(m[1]!))
      .filter((i) => i >= 0 && i < options.length),
  );
  if (letters.size) return [...letters].sort((a, b) => a - b);

  const normalizedOptions = options.map(normalize);
  const quoted = [...correctPart.matchAll(/(?<![A-Za-z])CORRECT:\s*[\u201c"]([^\u201d"]+)[\u201d"]/g)].map(
    (m) => normalize(m[1]!),
  );
  const fromQuotes = new Set<number>();
  for (const quote of quoted) {
    normalizedOptions.forEach((opt, i) => {
      if (opt && (quote === opt || quote.includes(opt) || opt.includes(quote))) fromQuotes.add(i);
    });
  }
  if (fromQuotes.size) return [...fromQuotes].sort((a, b) => a - b);

  const haystack = normalize(correctPart);
  return normalizedOptions.flatMap((opt, i) => (opt && haystack.includes(opt) ? [i] : []));
}

function cleanExplanation(lines: string[]): string {
  return lines
    .filter((l) => !/^\s*Topic:/.test(l))
    .join('\n')
    .replace(/[\u2705\u274c]\ufe0f?/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function parsePracticeSet(raw: string): ParseResult {
  const lines = raw.replace(/\r/g, '').replace(NBSP, ' ').split('\n');
  const starts = lines.flatMap((line, i) => (HEADER.test(line) ? [i] : []));
  const result: ParseResult = { questions: [], unresolved: [], malformed: [] };

  starts.forEach((start, k) => {
    const n = Number(HEADER.exec(lines[start]!)![1]);
    let end = k + 1 < starts.length ? starts[k + 1]! : lines.length;
    const footer = lines.slice(start, end).findIndex((l) => FOOTER.test(l));
    if (footer !== -1) end = start + footer;

    const block = lines.slice(start + 1, end);
    const stateAt = block.findIndex((l) => STATE_LINE.test(l));
    if (stateAt === -1) return void result.malformed.push(n);

    const explanation = cleanExplanation(block.slice(stateAt + 1));
    const stemHint = block.slice(0, stateAt).join('\n');
    const split = splitOptions(block.slice(0, stateAt), explanation, stemHint);
    if (!split) return void result.malformed.push(n);

    const question = split.stem.join('\n');
    const countHint = MULTI_HINT.exec(stemHint);
    const expected = countHint ? (/two|2/i.test(countHint[2]!) ? 2 : 3) : null;
    let answers = findCorrectIndexes(explanation, split.options);
    if (!answers.length || (expected !== null && answers.length !== expected)) {
      result.unresolved.push(n);
      answers = [];
    }

    result.questions.push({
      n,
      domain: classifyDomain(`${question}\n${split.options.join('\n')}\n${explanation}`),
      multi: answers.length > 1 || (answers.length === 0 && expected !== null),
      question,
      options: split.options,
      answers,
      explanation,
    });
  });

  return result;
}

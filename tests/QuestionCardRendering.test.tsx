import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuestionCard } from '../src/quiz/components/QuestionCard';
import type { Question, QuestionProgress } from '../src/quiz/quiz.types';
import { renderWithProviders as render } from './testUtils';

function makeQuestion(overrides: Partial<Question> = {}): Question {
  return {
    n: 3,
    d: 'ING',
    m: 0,
    q: 'Plain question',
    o: ['Option one', 'Option two'],
    a: [0],
    x: 'Plain explanation',
    exam: 1,
    certId: 'databricks-dea',
    id: 'E1Q3',
    qByLocale: {},
    oByLocale: {},
    xByLocale: {},
    ...overrides,
  };
}

function renderCard(question: Question, extra: Partial<Parameters<typeof QuestionCard>[0]> = {}) {
  const props = {
    question,
    entry: undefined,
    searchTerm: '',
    onGrade: vi.fn(),
    onReveal: vi.fn(),
    onRetry: vi.fn(),
    ...extra,
  };
  return { ...render(<QuestionCard {...props} />), props };
}

const entry = (overrides: Partial<QuestionProgress>): QuestionProgress => ({
  questionId: 'E1Q3',
  certId: 'databricks-dea',
  ok: false,
  picked: [1],
  revealed: false,
  updatedAt: 'now',
  ...overrides,
});

describe('QuestionCard code rendering', () => {
  it.each([
    ['sql', 'sql*SELECT id FROM t*sql', 'SELECT id FROM t'],
    ['python', 'python*df = spark.read.table("t")*python', 'df = spark.read.table("t")'],
    ['spark alias', 'spark*df.show()*spark', 'df.show()'],
    ['yaml', 'yaml*key: value*yaml', 'key: value'],
    ['bash', 'bash*ls -la*bash', 'ls -la'],
    ['json', 'json*{"a": 1}*json', '{"a": 1}'],
    ['plain code tag', 'code*/mnt/data/file.csv*code', '/mnt/data/file.csv'],
  ])('renders an authored %s tag', (_label, text, expected) => {
    const { container } = renderCard(makeQuestion({ q: `Intro ${text} outro` }));
    expect(container.textContent).toContain(expected);
    expect(container.textContent).toContain('Intro');
    expect(container.textContent).toContain('outro');
  });

  it.each([
    ['bash cli', '```\ndatabricks bundle deploy --target prod\n```', 'databricks bundle deploy'],
    ['sql statement', '```\nSHOW TABLES\n```', 'SHOW TABLES'],
    ['json', '```json\n{"a": 1}\n```', '"a": 1'],
    ['invalid json-looking text', "```\n{'a': 1}\n```", "'a': 1"],
    ['yaml', '```\nname: demo\nkind: job\n```', 'name: demo'],
    ['python import', '```\nimport os\n```', 'import os'],
    ['pyspark chain', '```\nout = my_df.select("a")\n```', 'my_df.select'],
    ['sql hint inside text', '```\nx = 1 -- note\nFROM table1\n```', 'FROM table1'],
    ['unrecognised text', '```\nzzz qqq\n```', 'zzz qqq'],
    ['empty fence', '```\n\n```', ''],
  ])('renders a legacy fenced block: %s', (_label, text, expected) => {
    const { container } = renderCard(makeQuestion({ q: `Before\n${text}\nAfter` }));
    expect(container.textContent).toContain(expected);
    expect(container.textContent).toContain('After');
  });

  it('renders inline code, including escaped backticks', () => {
    const { container } = renderCard(makeQuestion({ q: 'Use `OPTIMIZE` and `a\\`b` here' }));
    expect(container.querySelectorAll('code').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('a`b');
  });

  it('highlights the search term in the question text', () => {
    const { container } = renderCard(makeQuestion({ q: 'Find the needle here' }), { searchTerm: 'needle' });
    expect(container.querySelector('mark')?.textContent).toBe('needle');
  });
});

describe('QuestionCard layout and states', () => {
  it('shows the domain name, exam badge, custom badge, image and extra actions', () => {
    renderCard(makeQuestion({ image: '/diagram.png' }), {
      badge: <span>AI badge</span>,
      extraActions: <button>Extra</button>,
    });
    expect(screen.getByText('AI badge')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extra' })).toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute('src', '/diagram.png');
  });

  it('falls back to the raw domain code and hides the exam badge when not applicable', () => {
    renderCard(makeQuestion({ d: 'UNKNOWN', exam: 0 }));
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
    expect(screen.queryByText(/Exam/i)).not.toBeInTheDocument();
  });

  it('supports multi-answer questions: toggle, submit and reveal', async () => {
    const user = userEvent.setup();
    const { props } = renderCard(makeQuestion({ m: 1, a: [0, 1], o: ['A1', 'B2', 'C3'] }));

    const submit = screen.getByRole('button', { name: /check/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByText('A1'));
    await user.click(screen.getByText('B2'));
    await user.click(screen.getByText('B2'));
    await user.click(submit);
    expect(props.onGrade).toHaveBeenCalledWith(expect.anything(), [0]);

    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(props.onReveal).toHaveBeenCalled();
  });

  it('calls onReveal for single-answer questions', async () => {
    const user = userEvent.setup();
    const { props } = renderCard(makeQuestion());
    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    expect(props.onReveal).toHaveBeenCalledTimes(1);
  });

  it('shows the incorrect verdict and retries', async () => {
    const user = userEvent.setup();
    const { props } = renderCard(makeQuestion(), { entry: entry({ ok: false, picked: [1] }) });
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(props.onRetry).toHaveBeenCalledWith('E1Q3');
  });

  it('shows the revealed state without grading', () => {
    renderCard(makeQuestion(), { entry: entry({ revealed: true, picked: [] }) });
    expect(screen.getByText(/revealed/i)).toBeInTheDocument();
  });

  it('does not grade options after the question was answered', async () => {
    const user = userEvent.setup();
    const { props } = renderCard(makeQuestion({ m: 1, a: [0, 1] }), {
      entry: entry({ ok: true, picked: [0, 1] }),
    });
    await user.click(screen.getByText('Option one'));
    expect(props.onGrade).not.toHaveBeenCalled();
  });
});

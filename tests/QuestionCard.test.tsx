import { screen } from '@testing-library/react';
import { renderWithProviders as render } from './testUtils';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuestionCard } from '../src/quiz/components/QuestionCard';
import type { Question } from '../src/quiz/quiz.types';

const question: Question = {
  n: 1,
  d: 'ING',
  m: 0,
  q: 'What loads files incrementally from cloud storage?',
  o: ['Auto Loader', 'COPY INTO'],
  a: [0],
  x: 'Auto Loader is designed for incremental, scalable file ingestion.',
  exam: 1,
  id: 'E1Q1',
  qByLocale: { en: 'What loads files incrementally from cloud storage?' },
  oByLocale: { en: ['Auto Loader', 'COPY INTO'] },
  xByLocale: { en: 'Auto Loader is designed for incremental, scalable file ingestion.' },
};

describe('QuestionCard', () => {
  it('calls onGrade with the picked option when a single-choice option is clicked', async () => {
    const user = userEvent.setup();
    const onGrade = vi.fn();

    render(
      <QuestionCard
        question={question}
        entry={undefined}
        searchTerm=""
        onGrade={onGrade}
        onReveal={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Auto Loader'));
    expect(onGrade).toHaveBeenCalledWith(question, [0]);
  });

  it('shows the correctness verdict and explanation once answered', () => {
    render(
      <QuestionCard
        question={question}
        entry={{ questionId: 'E1Q1', ok: true, picked: [0], revealed: false, updatedAt: 'now' }}
        searchTerm=""
        onGrade={vi.fn()}
        onReveal={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Correct')).toBeInTheDocument();
    expect(screen.getByText(/incremental, scalable file ingestion/)).toBeInTheDocument();
  });

  it('disables options once the question has been answered', () => {
    render(
      <QuestionCard
        question={question}
        entry={{ questionId: 'E1Q1', ok: false, picked: [1], revealed: false, updatedAt: 'now' }}
        searchTerm=""
        onGrade={vi.fn()}
        onReveal={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Auto Loader').closest('button')).toBeDisabled();
    expect(screen.getByText('Incorrect')).toBeInTheDocument();
  });

  it('calls onRetry with the question id when Retry is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <QuestionCard
        question={question}
        entry={{ questionId: 'E1Q1', ok: true, picked: [0], revealed: false, updatedAt: 'now' }}
        searchTerm=""
        onGrade={vi.fn()}
        onReveal={vi.fn()}
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledWith('E1Q1');
  });

  it('calls onReveal when Show answer is clicked before answering', async () => {
    const user = userEvent.setup();
    const onReveal = vi.fn();
    render(
      <QuestionCard
        question={question}
        entry={undefined}
        searchTerm=""
        onGrade={vi.fn()}
        onReveal={onReveal}
        onRetry={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Show answer'));
    expect(onReveal).toHaveBeenCalledWith(question);
  });

  it('shows "Answer revealed" instead of a correctness verdict when revealed', () => {
    render(
      <QuestionCard
        question={question}
        entry={{ questionId: 'E1Q1', ok: false, picked: [], revealed: true, updatedAt: 'now' }}
        searchTerm=""
        onGrade={vi.fn()}
        onReveal={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('Answer revealed')).toBeInTheDocument();
  });

  describe('code block language detection', () => {
    function questionWithCode(code: string): Question {
      return {
        ...question,
        id: 'E1Q99',
        q: `Given the following snippet:\n\`\`\`\n${code}\n\`\`\`\nWhat does it do?`,
      };
    }

    it('detects a CLI command as bash, not sql', () => {
      render(
        <QuestionCard
          question={questionWithCode('databricks bundle deploy --target prod --non-interactive')}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      expect(codeEl).toHaveClass('language-bash');
    });

    it('detects a YAML bundle target block as yaml, not sql', () => {
      render(
        <QuestionCard
          question={questionWithCode(
            'targets:\n  dev:\n    mode: development\n    workspace:\n      host: https://adb-1234.net',
          )}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      expect(codeEl).toHaveClass('language-yaml');
    });

    it('detects a PySpark snippet as python', () => {
      render(
        <QuestionCard
          question={questionWithCode(
            'import dlt\n\n@dlt.table\ndef bronze_events():\n    return spark.readStream.format("cloudFiles")',
          )}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      expect(codeEl).toHaveClass('language-python');
    });

    it('detects a SQL DDL snippet as sql', () => {
      render(
        <QuestionCard
          question={questionWithCode(
            'CREATE STREAMING TABLE sales_silver\nAS SELECT store_id, total + tax AS total_after_tax\n   FROM sales_bronze',
          )}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      expect(codeEl).toHaveClass('language-sql');
    });

    it('wraps long lines instead of allowing horizontal scroll, on any screen size', () => {
      render(
        <QuestionCard
          question={questionWithCode(
            'GRANT SELECT ON SCHEMA enterprise.reporting TO finance_analyst_role_with_a_very_long_name_that_would_overflow;',
          )}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      const preEl = codeEl?.closest('pre');
      // Wrapping lives on each line's content span (the second child of
      // each line row: line-number gutter, then content) since line
      // numbers need every source line to be its own row.
      const lineContent = codeEl?.querySelector('div > span:last-child');
      expect(lineContent).toHaveClass('whitespace-pre-wrap');
      expect(lineContent).toHaveClass('break-words');
      expect(lineContent?.className).not.toMatch(/\bw-max\b/);
      expect(preEl?.className).not.toMatch(/overflow-x-auto/);
    });

    it('renders one line-numbered row per source line', () => {
      render(
        <QuestionCard
          question={questionWithCode('SELECT 1;\nSELECT 2;\nSELECT 3;')}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      const lineNumbers = Array.from(codeEl?.querySelectorAll('div > span:first-child') ?? []).map(
        (el) => el.textContent,
      );
      expect(lineNumbers).toEqual(['1', '2', '3']);
    });

    it('colors double-quoted strings the same as single-quoted ones', () => {
      render(
        <QuestionCard
          question={questionWithCode(
            'SELECT CASE WHEN is_account_group_member("doctors") THEN diagnosis ELSE \'CONFIDENTIAL\' END',
          )}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      const strings = codeEl?.querySelectorAll('.hljs-string');
      // Both the double-quoted "doctors" and single-quoted 'CONFIDENTIAL'
      // should get the same hljs-string treatment -- the bundled grammar
      // leaves double-quoted text completely unstyled by default (ANSI SQL
      // treats it as an identifier, not a string), which is the exact
      // inconsistency this patch fixes.
      expect(strings).toHaveLength(2);
      expect(strings?.[0].textContent).toContain('doctors');
      expect(strings?.[1].textContent).toContain('CONFIDENTIAL');
    });

    it('recognizes Databricks/Delta-specific SQL keywords the base grammar misses', () => {
      render(
        <QuestionCard
          question={questionWithCode(
            'OPTIMIZE sales ZORDER BY (customer_id);\nVACUUM sales RETAIN 168 HOURS;',
          )}
          entry={undefined}
          searchTerm=""
          onGrade={vi.fn()}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );
      const codeEl = document.querySelector('code.hljs');
      const keywordTexts = Array.from(codeEl?.querySelectorAll('.hljs-keyword') ?? []).map((el) =>
        el.textContent?.toLowerCase(),
      );
      expect(keywordTexts).toEqual(expect.arrayContaining(['optimize', 'zorder', 'vacuum']));
    });
  });

  describe('multi-answer questions', () => {
    const multiQuestion: Question = {
      n: 2,
      d: 'TRA',
      m: 1,
      q: 'Which of the following are Delta Lake features?',
      o: ['ACID transactions', 'Time travel', 'Schema enforcement'],
      a: [0, 1],
      x: 'ACID transactions and time travel are core Delta Lake features.',
      exam: 1,
      id: 'E1Q2',
      qByLocale: { en: 'Which of the following are Delta Lake features?' },
      oByLocale: { en: ['ACID transactions', 'Time travel', 'Schema enforcement'] },
      xByLocale: { en: 'ACID transactions and time travel are core Delta Lake features.' },
    };

    it('accumulates selections and only grades once Check selection is clicked', async () => {
      const user = userEvent.setup();
      const onGrade = vi.fn();

      render(
        <QuestionCard
          question={multiQuestion}
          entry={undefined}
          searchTerm=""
          onGrade={onGrade}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );

      await user.click(screen.getByText('ACID transactions'));
      await user.click(screen.getByText('Time travel'));
      expect(onGrade).not.toHaveBeenCalled();

      await user.click(screen.getByText('Check selection'));
      expect(onGrade).toHaveBeenCalledWith(multiQuestion, [0, 1]);
    });

    it('toggles a selected option off when clicked twice', async () => {
      const user = userEvent.setup();
      const onGrade = vi.fn();

      render(
        <QuestionCard
          question={multiQuestion}
          entry={undefined}
          searchTerm=""
          onGrade={onGrade}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );

      await user.click(screen.getByText('ACID transactions'));
      await user.click(screen.getByText('ACID transactions'));
      // Check selection stays disabled since nothing is selected anymore.
      expect(screen.getByText('Check selection')).toBeDisabled();
    });

    it('does not call onGrade if Check selection is clicked with nothing picked', () => {
      const onGrade = vi.fn();

      render(
        <QuestionCard
          question={multiQuestion}
          entry={undefined}
          searchTerm=""
          onGrade={onGrade}
          onReveal={vi.fn()}
          onRetry={vi.fn()}
        />,
      );

      expect(screen.getByText('Check selection')).toBeDisabled();
      expect(onGrade).not.toHaveBeenCalled();
    });
  });
});

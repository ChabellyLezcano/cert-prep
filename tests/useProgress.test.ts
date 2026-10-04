import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Question } from '@/quiz/quiz.types';

type Result = { data?: unknown[] | null; error?: { message: string } | null };

const calls: { method: string; args: unknown[] }[] = [];
let result: Result = { data: [], error: null };

function makeChain() {
  const chain: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'upsert', 'delete']) {
    chain[method] = (...args: unknown[]) => {
      calls.push({ method, args });
      return chain;
    };
  }
  chain.then = (resolve: (r: Result) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

vi.mock('@/shared/lib/supabaseClient', () => ({
  supabase: { from: () => makeChain() },
}));

const { useProgress, buildGradedEntry, buildRevealedEntry } = await import('../src/quiz/hooks/useProgress');

const question = {
  id: 'E1Q1',
  certId: 'databricks-dea',
  exam: 1,
  a: [0, 2],
} as unknown as Question;

describe('progress entry builders', () => {
  it('grades a correct answer regardless of the order of picks', () => {
    expect(buildGradedEntry(question, [2, 0])).toMatchObject({
      questionId: 'E1Q1',
      ok: true,
      revealed: false,
    });
  });

  it('grades a wrong answer', () => {
    expect(buildGradedEntry(question, [1]).ok).toBe(false);
  });

  it('builds a revealed entry as not ok with no picks', () => {
    expect(buildRevealedEntry(question)).toMatchObject({ ok: false, picked: [], revealed: true });
  });
});

describe('useProgress', () => {
  beforeEach(() => {
    calls.length = 0;
    result = { data: [], error: null };
  });

  it('returns an empty map and stops loading when there is no user', async () => {
    const { result: hook } = renderHook(() => useProgress(null));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    expect(hook.current.progress).toEqual({});
  });

  it('loads and maps the stored rows for a user', async () => {
    result = {
      data: [{ question_id: 'E1Q1', cert_id: 'c', ok: true, picked: [0], revealed: false, updated_at: 't' }],
    };
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    expect(hook.current.progress['E1Q1']).toMatchObject({ certId: 'c', ok: true, picked: [0] });
    expect(calls).toContainEqual({ method: 'eq', args: ['user_id', 'user-1'] });
  });

  it('handles a null data payload', async () => {
    result = { data: null, error: null };
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    expect(hook.current.progress).toEqual({});
  });

  it('exposes the error when loading fails', async () => {
    result = { error: { message: 'load failed' } };
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.syncError).toBe('load failed'));
    expect(hook.current.isLoading).toBe(false);
  });

  it('grades a question and upserts it', async () => {
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    act(() => hook.current.gradeQuestion(question, [0, 2]));
    expect(hook.current.progress['E1Q1']?.ok).toBe(true);
    expect(calls.some((c) => c.method === 'upsert')).toBe(true);
  });

  it('reveals a question', async () => {
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    act(() => hook.current.revealQuestion(question));
    expect(hook.current.progress['E1Q1']?.revealed).toBe(true);
  });

  it('does not call the backend to persist when there is no user', async () => {
    const { result: hook } = renderHook(() => useProgress(null));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    act(() => hook.current.gradeQuestion(question, [0]));
    act(() => hook.current.retryQuestion('E1Q1'));
    act(() => hook.current.resetAll());
    expect(calls).toEqual([]);
  });

  it('retries a question by removing it locally and remotely', async () => {
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    act(() => hook.current.gradeQuestion(question, [0]));
    act(() => hook.current.retryQuestion('E1Q1'));
    expect(hook.current.progress['E1Q1']).toBeUndefined();
    expect(calls).toContainEqual({ method: 'eq', args: ['question_id', 'E1Q1'] });
  });

  it('resets all progress', async () => {
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    act(() => hook.current.gradeQuestion(question, [0]));
    act(() => hook.current.resetAll());
    expect(hook.current.progress).toEqual({});
    expect(calls.some((c) => c.method === 'delete')).toBe(true);
  });

  it('surfaces persistence errors', async () => {
    const { result: hook } = renderHook(() => useProgress('user-1'));
    await waitFor(() => expect(hook.current.isLoading).toBe(false));
    result = { error: { message: 'write failed' } };
    act(() => hook.current.gradeQuestion(question, [0]));
    await waitFor(() => expect(hook.current.syncError).toBe('write failed'));
  });
});

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderWithProviders as render } from './testUtils';

vi.mock('react-router-dom', () => ({ useParams: () => ({ certId: 'databricks-dea' }) }));
vi.mock('@/auth/useAuth', () => ({ useAuth: () => ({ user: { id: 'user-1' } }) }));
vi.mock('@/shared/lib/supabaseClient', () => ({ supabase: {} }));

const generateMock = vi.fn();
let topicError: string | null = null;
vi.mock('@/quiz/hooks/useGenerateAiQuestions', () => ({
  useGenerateAiQuestions: () => ({ generate: generateMock, isLoading: false, error: topicError }),
}));

vi.mock('@/quiz/hooks/useGenerateAiExam', () => ({
  useGenerateAiExam: () => ({ generateExam: vi.fn(), isLoading: false, progress: null, error: null }),
}));

const saveMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/quiz/hooks/useFavoriteAiQuestions', () => ({
  useFavoriteAiQuestions: () => ({
    save: saveMock,
    favorites: [],
    isLoading: false,
    remove: vi.fn(),
    refetch: vi.fn(),
  }),
}));

// Imported after the mocks are registered so the component picks them up.
const { AiGeneratePage } = await import('../src/quiz/ai/AiGeneratePage');

const AI_QUESTION = {
  id: 'AI-1',
  certId: 'databricks-dea',
  domain: 'ING',
  m: 0 as const,
  q: 'What loads files incrementally from cloud storage?',
  o: ['Auto Loader', 'COPY INTO'],
  a: [0],
  x: 'Auto Loader is designed for incremental, scalable file ingestion.',
  questionLocale: 'en' as const,
  explanationLocale: 'es' as const,
  sourceTopicIds: [],
};

beforeEach(() => {
  generateMock.mockReset();
  saveMock.mockClear();
  topicError = null;
});

describe('AiGeneratePage auto-save on incorrect answer', () => {
  it('saves the question to AI favorites automatically when answered incorrectly', async () => {
    generateMock.mockResolvedValue([AI_QUESTION]);
    const user = userEvent.setup();
    render(<AiGeneratePage />);

    await user.click(screen.getByText('Generate questions'));
    await waitFor(() => expect(screen.getByText('Auto Loader')).toBeInTheDocument());

    await user.click(screen.getByText('COPY INTO')); // wrong option

    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(saveMock).toHaveBeenCalledWith(AI_QUESTION);
  });

  it('does not save the question when answered correctly', async () => {
    generateMock.mockResolvedValue([AI_QUESTION]);
    const user = userEvent.setup();
    render(<AiGeneratePage />);

    await user.click(screen.getByText('Generate questions'));
    await waitFor(() => expect(screen.getByText('Auto Loader')).toBeInTheDocument());

    await user.click(screen.getByText('Auto Loader')); // correct option

    // "Correct" verdict appearing confirms grading already ran; save should
    // never have been triggered for it.
    await waitFor(() => expect(screen.getByText('Correct')).toBeInTheDocument());
    expect(saveMock).not.toHaveBeenCalled();
  });

  it('does not save twice if the manual Save button is also clicked after an auto-save', async () => {
    generateMock.mockResolvedValue([AI_QUESTION]);
    const user = userEvent.setup();
    render(<AiGeneratePage />);

    await user.click(screen.getByText('Generate questions'));
    await waitFor(() => expect(screen.getByText('Auto Loader')).toBeInTheDocument());

    await user.click(screen.getByText('COPY INTO')); // wrong -> auto-saved
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));

    // Manual save button should now read "Saved" and be disabled, per the
    // existing savedIds-driven UI -- but even if clicked, handleSave's own
    // guard must prevent a second insert.
    const savedButton = screen.getByText('Saved').closest('button');
    expect(savedButton).toBeDisabled();
  });
});

describe('AiGeneratePage controls and answer flows', () => {
  it('passes the chosen domain and question count to the generator', async () => {
    generateMock.mockResolvedValue([]);
    const user = userEvent.setup();
    render(<AiGeneratePage />);

    await user.click(screen.getByRole('button', { name: 'TRA' }));
    await user.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByRole('button', { name: 'TRA' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '10' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByText('Generate questions'));
    await waitFor(() =>
      expect(generateMock).toHaveBeenCalledWith({ certId: 'databricks-dea', domain: 'TRA', count: 10 }),
    );
  });

  it('shows the generator error', () => {
    topicError = 'Edge function failed';
    render(<AiGeneratePage />);
    expect(screen.getByText('Edge function failed')).toBeInTheDocument();
  });

  it('saves a question manually with the save button, only once', async () => {
    generateMock.mockResolvedValue([AI_QUESTION]);
    const user = userEvent.setup();
    render(<AiGeneratePage />);

    await user.click(screen.getByText('Generate questions'));
    await waitFor(() => expect(screen.getByText('Auto Loader')).toBeInTheDocument());

    await user.click(screen.getByText('Save to favorites'));
    await waitFor(() => expect(saveMock).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Saved')).toBeInTheDocument();
  });

  it('reveals the answer without saving, then lets the user retry', async () => {
    generateMock.mockResolvedValue([AI_QUESTION]);
    const user = userEvent.setup();
    render(<AiGeneratePage />);

    await user.click(screen.getByText('Generate questions'));
    await waitFor(() => expect(screen.getByText('Auto Loader')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'Show answer' }));
    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: 'Show answer' })).toBeInTheDocument();
    expect(saveMock).not.toHaveBeenCalled();
  });
});

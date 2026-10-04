import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/shared/i18n/LocaleContext';
import { useLocale } from '@/shared/i18n/useLocale';

const wrapper = ({ children }: { children: ReactNode }) => <LocaleProvider>{children}</LocaleProvider>;

describe('LocaleProvider / useLocale', () => {
  afterEach(() => window.localStorage.clear());

  it('throws when used outside the provider', () => {
    expect(() => renderHook(() => useLocale())).toThrow('within a LocaleProvider');
  });

  it('exposes default preferences', () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current).toMatchObject({ appLocale: 'en', questionLocale: 'en', explanationLocale: 'es' });
  });

  it('updates and persists each preference independently', () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    act(() => result.current.setAppLocale('es'));
    act(() => result.current.setQuestionLocale('es'));
    act(() => result.current.setExplanationLocale('en'));
    expect(result.current).toMatchObject({ appLocale: 'es', questionLocale: 'es', explanationLocale: 'en' });
    const stored = JSON.parse(window.localStorage.getItem('cert-prep:locale-preferences') ?? '{}');
    expect(stored).toEqual({ appLocale: 'es', questionLocale: 'es', explanationLocale: 'en' });
  });

  it('restores stored preferences on mount', () => {
    window.localStorage.setItem(
      'cert-prep:locale-preferences',
      JSON.stringify({ appLocale: 'es', questionLocale: 'en', explanationLocale: 'en' }),
    );
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.appLocale).toBe('es');
  });

  it('translates keys in the active app language', () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    const en = result.current.t('auth.login.submit');
    act(() => result.current.setAppLocale('es'));
    expect(result.current.t('auth.login.submit')).not.toBe(en);
  });

  it('interpolates provided params and keeps unknown tokens', () => {
    const { result } = renderHook(() => useLocale(), { wrapper });
    expect(result.current.t('certifications.examGuide', { version: 'May 2026' })).toBe(
      'Exam guide: May 2026',
    );
    expect(result.current.t('certifications.examGuide', { other: 'x' })).toBe('Exam guide: {version}');
    expect(result.current.t('certifications.examGuide')).toBe('Exam guide: {version}');
  });
});

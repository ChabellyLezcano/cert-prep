import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PREFERENCES, loadLocalePreferences, saveLocalePreferences } from '@/shared/i18n/locale';
import { resolveLocaleField } from '@/shared/i18n/resolveLocaleField';
import { sleep } from '@/shared/utils/sleep';

const KEY = 'cert-prep:locale-preferences';

describe('locale preferences', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadLocalePreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it('round-trips saved preferences', () => {
    saveLocalePreferences({ appLocale: 'es', questionLocale: 'es', explanationLocale: 'en' });
    expect(loadLocalePreferences()).toEqual({
      appLocale: 'es',
      questionLocale: 'es',
      explanationLocale: 'en',
    });
  });

  it('falls back per field when stored values are invalid', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ appLocale: 'fr', questionLocale: 'es' }));
    expect(loadLocalePreferences()).toEqual({ ...DEFAULT_PREFERENCES, questionLocale: 'es' });
  });

  it('returns defaults when the stored JSON is corrupt', () => {
    window.localStorage.setItem(KEY, '{not json');
    expect(loadLocalePreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it('does not throw when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveLocalePreferences(DEFAULT_PREFERENCES)).not.toThrow();
  });
});

describe('resolveLocaleField', () => {
  it('returns the preferred locale when present', () => {
    expect(resolveLocaleField({ en: 'hello', es: 'hola' }, 'es')).toBe('hola');
  });

  it('falls back to any available locale', () => {
    expect(resolveLocaleField({ en: 'hello' }, 'es')).toBe('hello');
  });

  it('throws when no locale has content', () => {
    expect(() => resolveLocaleField({}, 'en')).toThrow('no locale variant');
  });
});

describe('sleep', () => {
  it('resolves after the given delay', async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    const p = sleep(500).then(done);
    await vi.advanceTimersByTimeAsync(499);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(done).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

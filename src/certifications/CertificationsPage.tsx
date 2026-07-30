import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/shared/components/Button';
import { ThemeToggle } from '@/shared/components/ThemeToggle';
import { LanguageSettings } from '@/shared/components/LanguageSettings';
import { CERTIFICATIONS, PROVIDERS } from '@/certifications/registry';
import { CertificationBadge } from '@/certifications/CertificationBadge';
import { useLocale } from '@/shared/i18n/useLocale';

const ALL_PROVIDERS = 'ALL';

export function CertificationsPage() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  const [query, setQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>(ALL_PROVIDERS);

  const groupedCertifications = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = CERTIFICATIONS.filter((cert) => {
      const matchesProvider = providerFilter === ALL_PROVIDERS || cert.provider === providerFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        cert.name.toLowerCase().includes(normalizedQuery) ||
        cert.acronym.toLowerCase().includes(normalizedQuery) ||
        cert.provider.toLowerCase().includes(normalizedQuery);
      return matchesProvider && matchesQuery;
    });

    const groups = new Map<string, typeof filtered>();
    for (const cert of filtered) {
      const existing = groups.get(cert.provider);
      if (existing) {
        existing.push(cert);
      } else {
        groups.set(cert.provider, [cert]);
      }
    }
    // Preserve PROVIDERS' first-seen order rather than Map insertion order,
    // so groups appear in a stable order regardless of filtering.
    return PROVIDERS.filter((provider) => groups.has(provider)).map((provider) => ({
      provider,
      certs: groups.get(provider)!,
    }));
  }, [query, providerFilter]);

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <span className="text-xl font-extrabold tracking-tight text-ink-900">Cert Prep</span>

          <div className="flex min-w-0 items-center gap-3">
            <ThemeToggle />
            <span className="hidden max-w-[14rem] truncate text-sm text-ink-500 sm:inline">
              {user?.email}
            </span>
            <Button variant="ghost" onClick={() => signOut()}>
              {t('header.signOut')}
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <details className="group">
            <summary className="inline-block cursor-pointer text-xs font-semibold text-ink-400 hover:text-ink-600">
              {t('header.language')}
            </summary>
            <div className="mt-2 max-w-xs rounded-xl border border-ink-100 bg-surface shadow-sm">
              <LanguageSettings />
            </div>
          </details>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="mb-1 text-2xl font-bold text-ink-900">{t('certifications.title')}</h1>
        <p className="mb-6 text-sm text-ink-500">{t('certifications.subtitle')}</p>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('certifications.searchPlaceholder')}
              aria-label={t('certifications.searchPlaceholder')}
              className="w-full rounded-xl border border-ink-200 bg-surface py-2.5 pl-9 pr-3.5 text-sm text-ink-800 shadow-sm transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
            />
          </div>

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('certifications.filterByProvider')}
          >
            <ProviderChip
              label={t('certifications.allProviders')}
              active={providerFilter === ALL_PROVIDERS}
              onClick={() => setProviderFilter(ALL_PROVIDERS)}
            />
            {PROVIDERS.map((provider) => (
              <ProviderChip
                key={provider}
                label={provider}
                active={providerFilter === provider}
                onClick={() => setProviderFilter(provider)}
              />
            ))}
          </div>
        </div>

        {groupedCertifications.length === 0 && (
          <p className="rounded-2xl border border-dashed border-ink-200 p-8 text-center text-sm text-ink-400">
            {t('certifications.noResults')}
          </p>
        )}

        <div className="flex flex-col gap-8">
          {groupedCertifications.map(({ provider, certs }) => (
            <section key={provider}>
              {providerFilter === ALL_PROVIDERS && (
                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">{provider}</h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {certs.map((cert) => (
                  <Link
                    key={cert.id}
                    to={`/certifications/${cert.id}/quiz`}
                    className="group flex flex-col rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <CertificationBadge cert={cert} />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                          {cert.provider}
                        </span>
                        <span className="mt-1 text-lg font-bold text-ink-900">{cert.name}</span>
                      </div>
                    </div>
                    {cert.examGuideVersion && (
                      <span className="mt-2 text-xs text-ink-400">
                        {t('certifications.examGuide', { version: cert.examGuideVersion })}
                      </span>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-action">
                      {t('certifications.startStudying')}
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

interface ProviderChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function ProviderChip({ label, active, onClick }: ProviderChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'border-brand-400 bg-brand-100 text-brand-700'
          : 'border-ink-200 bg-surface text-ink-500 hover:border-brand-300 hover:text-brand-600'
      }`}
    >
      {label}
    </button>
  );
}

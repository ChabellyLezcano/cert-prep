// src/certifications/registry.ts
/**
 * Registry of certifications available in this app. This is the single
 * source of truth for certification metadata: seed scripts use it to stamp
 * `certId` on rows, and (once the multi-cert UI lands) the catalog page and
 * cert switcher will read from it too.
 *
 * Mirrors the `certifications` table in Supabase (see
 * supabase/migrations/0004_certifications.sql) -- this is the local,
 * human-editable counterpart used at build/seed time.
 */
export interface CertificationMeta {
  /** Stable slug id, matches certifications.id in Supabase, e.g. "databricks-dea" */
  id: string;
  name: string;
  /** Short label used in tight UI spots (header wordmark, tab titles),
   * e.g. "DEA", "SAA". Kept as an explicit field rather than derived from
   * `id`, since not every future cert's slug will cleanly map to one. */
  acronym: string;
  provider: string;
  examGuideVersion?: string;
  /** Path to a logo/badge image under /public, e.g. "/certifications/databricks-dea.svg".
   * Optional and intentionally NOT bundled with real vendor artwork -- official
   * certification badges are trademarked, so this repo ships no logo files.
   * Drop your own (Microsoft/Databricks/AWS/dbt Labs let certified holders use
   * the official digital badge for personal use) at this path and it renders
   * automatically; otherwise CertificationBadge falls back to an acronym chip. */
  logoUrl?: string;
}

export const CERTIFICATIONS: readonly CertificationMeta[] = [
  {
    id: 'databricks-dea',
    name: 'Data Engineer Associate',
    acronym: 'DEA',
    provider: 'Databricks',
    examGuideVersion: '2026-05-04',
    logoUrl: '/certifications/databricks-dea.svg',
  },
  {
    id: 'aws-saa',
    name: 'Solutions Architect Associate',
    acronym: 'SAA',
    provider: 'AWS',
    examGuideVersion: 'SAA-C03',
    logoUrl: '/certifications/aws-saa.svg',
  },
  {
    id: 'dbt-analytics-engineer',
    name: 'Analytics Engineering Certification',
    acronym: 'dbt',
    provider: 'dbt Labs',
    examGuideVersion: 'v1.7',
    logoUrl: '/certifications/dbt-analytics-engineer.svg',
  },
  {
    id: 'microsoft-pl-300',
    name: 'Power BI Data Analyst Associate',
    acronym: 'PL-300',
    provider: 'Microsoft',
    examGuideVersion: '2026-04-20',
    logoUrl: '/certifications/microsoft-pl-300.svg',
  },
  {
    id: 'microsoft-dp-700',
    name: 'Fabric Data Engineer Associate',
    acronym: 'DP-700',
    provider: 'Microsoft',
    examGuideVersion: '2026-07-21',
    logoUrl: '/certifications/microsoft-dp-700.svg',
  },
];

/** Every distinct provider across the registry, in first-seen order --
 * drives the provider filter/grouping on the certifications page without
 * hardcoding the list separately from CERTIFICATIONS itself. */
export const PROVIDERS: readonly string[] = [...new Set(CERTIFICATIONS.map((c) => c.provider))];

/** Convenience constant for the certification currently loaded end-to-end. */
export const DATABRICKS_DEA_CERT_ID = 'databricks-dea';

/** Looks up a certification's metadata by its route id. Returns undefined
 * for an unknown or missing id -- callers should fall back sensibly (see
 * AppLayout's use of this for the header wordmark). */
export function getCertification(id: string | undefined): CertificationMeta | undefined {
  if (!id) return undefined;
  return CERTIFICATIONS.find((cert) => cert.id === id);
}

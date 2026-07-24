import type { Domain, RawDomain } from '@/quiz/quiz.types';

/**
 * Eagerly import every certification's domains.ts at build time, e.g.
 * ./databricks-dea/domains.ts. Adding a new certification's domains is
 * just adding domains.ts under its own top-level folder here -- no import
 * list to update in this file.
 */
const domainModules = import.meta.glob<{ DOMAINS: RawDomain[] }>('./*/domains.ts', {
  eager: true,
});

const CERT_PATH_PATTERN = /^\.\/([^/]+)\/domains\.ts$/;

/** All domains across every loaded certification, each stamped with its certId. */
export const DOMAINS: Domain[] = Object.entries(domainModules).flatMap(([path, mod]) => {
  const match = CERT_PATH_PATTERN.exec(path);
  if (!match) {
    throw new Error(`Unexpected domains file path, expected "./<certId>/domains.ts": ${path}`);
  }
  const [, certId] = match;
  return mod.DOMAINS.map((domain) => ({ ...domain, certId }));
});

/**
 * Lookup by (certId, code). Domain codes are only unique *within* a
 * certification (e.g. more than one cert can reasonably have a "GOV" or
 * "ING" domain), so the map key is the compound `${certId}:${code}`
 * rather than the code alone -- a plain code-only key silently let one
 * cert's domain overwrite another's every time two certs happened to
 * reuse the same short code (this bit dbt's "GOV" clobbering Databricks
 * DEA's "GOV" the moment both were loaded together).
 */
export const DOMAIN_MAP: Record<string, Domain> = Object.fromEntries(
  DOMAINS.map((domain) => [`${domain.certId}:${domain.id}`, domain]),
);

/** Ergonomic accessor for DOMAIN_MAP's compound key -- prefer this over
 * indexing DOMAIN_MAP directly so the key format stays an implementation
 * detail. Returns undefined for an unknown (certId, code) pair. */
export function getDomain(certId: string, code: string): Domain | undefined {
  return DOMAIN_MAP[`${certId}:${code}`];
}

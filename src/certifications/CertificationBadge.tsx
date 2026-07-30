import { useState } from 'react';
import type { CertificationMeta } from '@/certifications/registry';

/** Deterministic background color per provider, so the acronym fallback
 * (and the image itself, via its frame) stays visually consistent for a
 * given provider across renders instead of shifting on each mount. */
const PROVIDER_COLORS: Record<string, string> = {
  Databricks: 'bg-orange-100 text-orange-700',
  AWS: 'bg-amber-100 text-amber-800',
  'dbt Labs': 'bg-emerald-100 text-emerald-700',
  Microsoft: 'bg-sky-100 text-sky-700',
};
const FALLBACK_COLOR = 'bg-brand-100 text-brand-700';

interface CertificationBadgeProps {
  cert: Pick<CertificationMeta, 'acronym' | 'provider' | 'logoUrl'>;
  className?: string;
}

/** Renders a certification's photo/logo when `logoUrl` is set and loads
 * successfully; otherwise (missing, 404, or not-yet-supplied artwork)
 * falls back to a colored acronym chip so the catalog never shows a
 * broken-image icon -- see the note on `logoUrl` in registry.ts for why
 * no real logo files ship with this repo. */
export function CertificationBadge({ cert, className = '' }: CertificationBadgeProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const colorClasses = PROVIDER_COLORS[cert.provider] ?? FALLBACK_COLOR;
  const showImage = Boolean(cert.logoUrl) && !imageFailed;

  if (showImage) {
    return (
      <img
        src={cert.logoUrl}
        alt={`${cert.provider} ${cert.acronym} logo`}
        className={`h-10 w-10 shrink-0 rounded-xl object-contain ${className}`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${colorClasses} ${className}`}
    >
      {cert.acronym}
    </span>
  );
}

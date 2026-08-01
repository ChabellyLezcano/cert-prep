import type { RawDomain } from '@/quiz/quiz.types';

/**
 * Official domains from the DP-700 study guide ("Skills measured as of
 * July 21, 2026"), Microsoft Learn:
 * https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-700
 *
 * Microsoft publishes all three as a 30-35% range rather than an exact
 * number; 33/33/34 sums to 100 as a reasonable midpoint -- update if a
 * future guide revision narrows the ranges.
 */
export const DOMAINS: RawDomain[] = [
  { id: 'IMPL', order: 1, name: 'Implement and manage an analytics solution', weight: 33 },
  { id: 'ING', order: 2, name: 'Ingest and transform data', weight: 33 },
  { id: 'MON', order: 3, name: 'Monitor and optimize an analytics solution', weight: 34 },
];

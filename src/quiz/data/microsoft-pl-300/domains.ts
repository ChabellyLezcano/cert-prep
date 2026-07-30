import type { RawDomain } from '@/quiz/quiz.types';

/**
 * Official domains from the Microsoft PL-300 (Power BI Data Analyst
 * Associate) skills-measured guide (April 20, 2026 version), in exam order
 * with their weight. Microsoft publishes these as ranges (e.g. "Prepare
 * the data: 15-20%"); the values below use the midpoint of each published
 * range so they sum to 100, matching the pattern used by the other certs
 * in this repo.
 */
export const DOMAINS: RawDomain[] = [
  { id: 'PREP', order: 1, name: 'Prepare the data', weight: 17 },
  { id: 'MODEL', order: 2, name: 'Model the data', weight: 32 },
  { id: 'VIS', order: 3, name: 'Visualize and analyze the data', weight: 28 },
  { id: 'MANAGE', order: 4, name: 'Manage and secure Power BI', weight: 23 },
];

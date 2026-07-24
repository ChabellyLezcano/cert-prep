import type { RawDomain } from '@/quiz/quiz.types';

/**
 * Official topics from the dbt Analytics Engineering Certification Exam
 * Study Guide (v9.0, ©2025 dbt Labs; exam supports dbt Core 1.7).
 * https://www.getdbt.com/dbt-assets/certifications/dbt-certificate-study-guide
 *
 * Unlike the Databricks/AWS exam guides, dbt Labs does not publish
 * official per-topic percentage weights -- all 8 are given an even split
 * as a neutral placeholder until/unless real weights are published.
 */
export const DOMAINS: RawDomain[] = [
  { id: 'DEV', order: 1, name: 'Developing dbt Models', weight: 12.5 },
  { id: 'GOV', order: 2, name: 'Understanding dbt Model Governance', weight: 12.5 },
  { id: 'DBG', order: 3, name: 'Debugging Data Modeling Errors', weight: 12.5 },
  { id: 'PIPE', order: 4, name: 'Managing Data Pipelines', weight: 12.5 },
  { id: 'TEST', order: 5, name: 'Implementing dbt Tests', weight: 12.5 },
  { id: 'DOC', order: 6, name: 'Creating and Maintaining dbt Documentation', weight: 12.5 },
  { id: 'EXT', order: 7, name: 'Implementing and Maintaining External Dependencies', weight: 12.5 },
  { id: 'STATE', order: 8, name: 'Leveraging the dbt State', weight: 12.5 },
];

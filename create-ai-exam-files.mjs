#!/usr/bin/env node
/**
 * add-dbt-certification.mjs
 *
 * Scaffolds a new certification -- dbt Analytics Engineering -- following
 * the exact same minimal-viable-content pattern used to add AWS SAA
 * (src/quiz/data/aws-saa, supabase/migrations/0005_aws_saa.sql):
 *
 *   1. Registers the cert in src/certifications/registry.ts
 *   2. Adds its 8 official topics as domains.ts (sourced from dbt Labs'
 *      own Analytics Engineering Certification Exam Study Guide, v9.0,
 *      2025 -- https://www.getdbt.com/dbt-assets/certifications/
 *      dbt-certificate-study-guide -- exam supports dbt Core 1.7). That
 *      guide does not publish per-topic percentage weights the way the
 *      Databricks/AWS guides do, so all 8 are given an even 12.5% split
 *      as a neutral placeholder -- update these once/if dbt Labs
 *      publishes real weights.
 *   3. Adds a starter exam (exam201 -- 201 to avoid colliding with DEA's
 *      1-24 or AWS SAA's 101, matching the "new hundred-block per cert"
 *      convention) with 3 original questions covering foundational
 *      concepts (ref()/DAG dependencies, incremental models, generic vs
 *      singular tests). These are NOT copied from dbt Labs' sample exam
 *      questions -- reproducing their copyrighted question text isn't
 *      appropriate here even for a study tool; write more of your own to
 *      build this out.
 *   4. Adds a Supabase migration inserting the cert + domain rows,
 *      mirroring 0005_aws_saa.sql exactly.
 *
 * No existing file is modified except registry.ts, and every step is
 * idempotent -- rerunning after a partial failure (or just to confirm
 * nothing's missing) is safe and won't duplicate anything.
 *
 * Run from the repo root:
 *   node add-dbt-certification.mjs
 *
 * After running, you still need to:
 *   - Add real exam content (this only seeds 3 starter questions)
 *   - Run `supabase db push` (or apply the new migration however you
 *     normally do) before `npm run db:seed`
 *   - Run `npm run db:seed` to push the new questions into Supabase
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CERT_ID = 'dbt-analytics-engineer';
const REGISTRY_PATH = resolve('src/certifications/registry.ts');
const DATA_DIR = resolve(`src/quiz/data/${CERT_ID}`);
const DOMAINS_PATH = resolve(`${DATA_DIR}/domains.ts`);
const EXAM_PATH = resolve(`${DATA_DIR}/exams/exam201.ts`);
const MIGRATION_PATH = resolve('supabase/migrations/0009_dbt_analytics_engineer.sql');

const DOMAINS_FILE = `import type { RawDomain } from '@/quiz/quiz.types';

/**
 * Official topics from the dbt Analytics Engineering Certification Exam
 * Study Guide (v9.0, \u00a92025 dbt Labs; exam supports dbt Core 1.7).
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
`;

const EXAM_FILE = `import type { RawQuestion } from '@/quiz/quiz.types';

/**
 * Minimal viable question set for dbt Analytics Engineering, used to
 * validate the multi-cert model end to end (same pattern as AWS SAA's
 * exam101.ts). Numbered 201 to avoid colliding with Databricks DEA's
 * exam 1-24 or AWS SAA's exam 101 (id scheme is
 * \`{examNumber}{n, 2-digit padded}\`, collision-free as long as exam
 * numbers themselves never collide).
 *
 * These are original questions, not reproduced from dbt Labs' own sample
 * exam questions in their study guide -- add more real content here.
 */
export const exam201: RawQuestion[] = [
  {
    n: 1,
    d: 'DEV',
    m: 0,
    q: 'A dbt project has a model stg_orders.sql that hardcodes the upstream table name directly in its FROM clause instead of using the ref() function. What is the main consequence of this?',
    o: [
      'The model will fail to compile until ref() is added',
      "dbt won't be able to infer this model's dependency, so it can't guarantee correct build order or include it in the DAG",
      'The model will run slower because ref() is required for query optimization',
      'dbt will automatically rewrite the hardcoded reference to use ref() at runtime',
    ],
    a: [1],
    x: 'dbt construye el grafo de dependencias (DAG) analizando las llamadas a ref() y source() en el código compilado; una referencia a una tabla escrita a mano es invisible para dbt, así que no puede garantizar el orden de construcción correcto ni incluir esa relación en el linaje. El SQL sigue siendo válido y compila sin problema, solo pierde el tracking de dependencias.',
  },
  {
    n: 2,
    d: 'DEV',
    m: 0,
    q: 'A fact table has hundreds of millions of rows, with new rows appended daily and existing rows never updated or deleted. Which materialization is the best fit to minimize build time and warehouse compute?',
    o: ['view', 'table', 'incremental', 'ephemeral'],
    a: [2],
    x: 'La materialización incremental permite a dbt procesar solo las filas nuevas desde la última ejecución (usando el macro is_incremental()), en vez de reconstruir la tabla completa cada vez; ideal quando solo se añaden filas nuevas. "table" reconstruiría todo desde cero cada run, "view" no persiste datos físicamente, y "ephemeral" ni siquiera crea un objeto en la base de datos.',
  },
  {
    n: 3,
    d: 'TEST',
    m: 0,
    q: 'A team needs to verify that a custom business rule ("total_amount must equal quantity * unit_price for every row") holds across an orders model. Which type of dbt test is most appropriate for this specific, one-off assertion?',
    o: [
      'A generic test applied via a config block in schema.yml',
      'A singular test: a standalone .sql file in the tests/ directory that selects rows violating the rule',
      'A source freshness check',
      'A contract with a not_null constraint on total_amount',
    ],
    a: [1],
    x: 'Un singular test es un archivo .sql independiente en tests/ que escribe una consulta arbitraria; si devuelve alguna fila, el test falla. Es la herramienta correcta para una regla de negocio puntual y específica de un modelo. Los generic tests (unique, not_null, relationships, accepted_values) están pensados para validaciones reutilizables en múltiples columnas/modelos, no para una expresión de negocio concreta como esta.',
  },
];
`;

const MIGRATION_FILE = `-- supabase/migrations/0009_dbt_analytics_engineer.sql
-- Third certification: dbt Analytics Engineering Certification Exam.
-- Minimal viable content, added to validate the multi-cert model end to
-- end (see src/quiz/data/dbt-analytics-engineer). Domain weights are an
-- even split -- dbt Labs doesn't publish official per-topic percentages
-- the way Databricks/AWS do (see the note in domains.ts).

insert into public.certifications (id, name, provider, exam_guide_version)
values ('dbt-analytics-engineer', 'Analytics Engineering Certification', 'dbt Labs', 'v1.7')
on conflict (id) do nothing;

insert into public.domains (cert_id, code, name, weight, domain_order)
values
  ('dbt-analytics-engineer', 'DEV', 'Developing dbt Models', 12.5, 1),
  ('dbt-analytics-engineer', 'GOV', 'Understanding dbt Model Governance', 12.5, 2),
  ('dbt-analytics-engineer', 'DBG', 'Debugging Data Modeling Errors', 12.5, 3),
  ('dbt-analytics-engineer', 'PIPE', 'Managing Data Pipelines', 12.5, 4),
  ('dbt-analytics-engineer', 'TEST', 'Implementing dbt Tests', 12.5, 5),
  ('dbt-analytics-engineer', 'DOC', 'Creating and Maintaining dbt Documentation', 12.5, 6),
  ('dbt-analytics-engineer', 'EXT', 'Implementing and Maintaining External Dependencies', 12.5, 7),
  ('dbt-analytics-engineer', 'STATE', 'Leveraging the dbt State', 12.5, 8)
on conflict (cert_id, code) do nothing;
`;

function ensureRegistryEntry() {
  if (!existsSync(REGISTRY_PATH)) {
    console.error(`Could not find ${REGISTRY_PATH}. Run this from the repo root.`);
    process.exit(1);
  }
  let src = readFileSync(REGISTRY_PATH, 'utf8');
  if (src.includes(`id: '${CERT_ID}'`)) {
    console.log('registry.ts already has the dbt entry -- nothing to do.');
    return;
  }
  const marker = "provider: 'AWS',\n    examGuideVersion: 'SAA-C03',\n  },\n];";
  const replacement = `provider: 'AWS',\n    examGuideVersion: 'SAA-C03',\n  },\n  {\n    id: '${CERT_ID}',\n    name: 'Analytics Engineering Certification',\n    acronym: 'dbt',\n    provider: 'dbt Labs',\n    examGuideVersion: 'v1.7',\n  },\n];`;
  if (!src.includes(marker)) {
    console.error(
      'Could not find the expected end of the CERTIFICATIONS array in registry.ts -- add the dbt entry manually:\n' +
        `  { id: '${CERT_ID}', name: 'Analytics Engineering Certification', acronym: 'dbt', provider: 'dbt Labs', examGuideVersion: 'v1.7' }`,
    );
    process.exit(1);
  }
  src = src.replace(marker, replacement);
  writeFileSync(REGISTRY_PATH, src, 'utf8');
  console.log(`Added '${CERT_ID}' to ${REGISTRY_PATH}`);
}

function writeIfMissing(path, contents, label) {
  if (existsSync(path)) {
    console.log(`${label} already exists -- nothing to do.`);
    return;
  }
  writeFileSync(path, contents, 'utf8');
  console.log(`Created ${path}`);
}

function main() {
  if (!existsSync(resolve('src/quiz/data'))) {
    console.error('Could not find src/quiz/data. Run this from the repo root.');
    process.exit(1);
  }

  ensureRegistryEntry();

  mkdirSync(resolve(`${DATA_DIR}/exams`), { recursive: true });
  writeIfMissing(DOMAINS_PATH, DOMAINS_FILE, 'domains.ts');
  writeIfMissing(EXAM_PATH, EXAM_FILE, 'exam201.ts');

  mkdirSync(resolve('supabase/migrations'), { recursive: true });
  writeIfMissing(MIGRATION_PATH, MIGRATION_FILE, 'migration 0009');

  // Self-verify
  const registrySrc = readFileSync(REGISTRY_PATH, 'utf8');
  const checks = [
    [registrySrc.includes(`id: '${CERT_ID}'`), 'registry.ts has the dbt entry'],
    [existsSync(DOMAINS_PATH), 'domains.ts exists'],
    [existsSync(EXAM_PATH), 'exam201.ts exists'],
    [existsSync(MIGRATION_PATH), 'migration 0009 exists'],
  ];
  const failed = checks.filter(([ok]) => !ok);
  if (failed.length > 0) {
    console.error('Verification failed:', failed.map(([, label]) => label).join(', '));
    process.exit(1);
  }

  console.log('\nAll good. Next steps:');
  console.log('  1. pnpm typecheck && pnpm lint && pnpm test && pnpm build');
  console.log('  2. Apply the new migration (supabase db push, or however you normally do)');
  console.log('  3. npm run db:seed');
  console.log('  4. Add real exam content to src/quiz/data/dbt-analytics-engineer/exams/');
}

main();

import type { RawQuestion } from '@/quiz/quiz.types';

/**
 * Minimal viable question set for dbt Analytics Engineering, used to
 * validate the multi-cert model end to end (same pattern as AWS SAA's
 * exam101.ts). Numbered 201 to avoid colliding with Databricks DEA's
 * exam 1-24 or AWS SAA's exam 101 (id scheme is
 * `{examNumber}{n, 2-digit padded}`, collision-free as long as exam
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

import type { RawQuestion } from '@/quiz/quiz.types';

/**
 * Minimal viable question set for DP-700 (Microsoft Fabric Data Engineer
 * Associate), used to validate the multi-cert model end to end (same
 * pattern as dbt's exam201.ts, AWS SAA's exam101.ts, and PL-300's
 * exam301.ts). Numbered 301 -- exam numbers only need to be unique
 * WITHIN this cert's own folder, so reusing "301" alongside PL-300's own
 * exam301.ts is safe (the id scheme is `{certId}-{examNumber}{n, 2-digit
 * padded}`, so the certId prefix keeps them collision-free).
 *
 * These are original questions grounded in real skill bullets from the
 * official study guide ("Skills measured as of July 21, 2026"), not
 * reproduced from Microsoft's own practice assessment or exam guide --
 * add more real content here.
 */
export const exam301: RawQuestion[] = [
  {
    n: 1,
    d: 'IMPL',
    m: 0,
    q: 'You need to build a daily process that reads from a REST API, applies light transformations with a visual, low-code editor, and lands the result in a Lakehouse table -- no custom code should be required. Which Fabric item should you use?',
    o: ['A pipeline Copy activity only', 'A Dataflow Gen2', 'A notebook with PySpark', 'An Eventstream'],
    a: [1],
    x: 'Dataflow Gen2 ofrece una interfaz visual tipo Power Query para extraer, transformar y cargar datos sin escribir código, ideal para transformaciones ligeras. Un notebook requeriría código PySpark, un Copy activity de pipeline mueve datos pero no transforma con esa interfaz, y Eventstream está pensado para datos en streaming, no para una carga diaria desde una API REST.',
  },
  {
    n: 2,
    d: 'ING',
    m: 0,
    q: 'Your team needs read access in Fabric to data that physically remains in an external ADLS Gen2 account owned by another team, without copying it into OneLake. Which capability should you use?',
    o: [
      'Mirroring',
      'A OneLake shortcut',
      'A Dataflow Gen2 with staging',
      'A pipeline Copy activity with overwrite',
    ],
    a: [1],
    x: 'Un OneLake shortcut crea una referencia virtual a datos que permanecen en su ubicación original (ADLS Gen2, S3, otro OneLake, etc.), sin duplicar el almacenamiento. Mirroring, en cambio, replica continuamente los datos de un origen (típicamente bases operacionales) hacia OneLake, generando una copia real gestionada por Fabric -- no es la opción correcta cuando el objetivo es referenciar sin copiar.',
  },
  {
    n: 3,
    d: 'IMPL',
    m: 0,
    q: 'You need different sales regions to see only the rows belonging to their own region when querying the same Warehouse table, enforced automatically regardless of which tool they use to connect. What should you implement?',
    o: [
      'Column-level security only',
      'Row-level security (RLS)',
      'A sensitivity label',
      'Object-level security on the schema',
    ],
    a: [1],
    x: 'La seguridad a nivel de fila (RLS) define predicados que filtran automáticamente qué filas ve cada usuario según su identidad o rol, aplicándose de forma consistente sin importar la herramienta de conexión. La seguridad a nivel de columna oculta columnas completas (no filas), las etiquetas de confidencialidad clasifican el contenido pero no restringen filas por sí solas, y la seguridad a nivel de objeto controla el acceso a tablas/esquemas enteros, no a subconjuntos de filas.',
  },
];

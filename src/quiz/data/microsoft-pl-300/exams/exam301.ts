import type { RawQuestion } from '@/quiz/quiz.types';

/**
 * Minimal viable question set for Microsoft PL-300 (Power BI Data Analyst
 * Associate), used to validate the multi-cert model end to end (same
 * pattern as dbt's exam201.ts and AWS SAA's exam101.ts). Numbered 301 to
 * avoid colliding with Databricks DEA's exam 1-24, AWS SAA's exam 101-111,
 * or dbt's exam 201 (id scheme is `{examNumber}{n, 2-digit padded}`,
 * collision-free as long as exam numbers themselves never collide).
 *
 * These are original questions, not reproduced from Microsoft's own
 * practice assessment or exam guide -- add more real content here.
 */
export const exam301: RawQuestion[] = [
  {
    n: 1,
    d: 'PREP',
    m: 0,
    q: 'You need to combine two queries in Power Query so that the result keeps all rows from both tables, matching on a common key where possible. Which operation should you use?',
    o: ['Merge queries', 'Append queries', 'Group by', 'Split column'],
    a: [1],
    x: 'Append queries apila filas de dos consultas con esquema compatible, conservando todas las filas de ambas (equivalente a un UNION). Merge queries, en cambio, combina columnas de dos tablas haciendo join sobre una clave, produciendo un número de filas distinto según el tipo de join elegido.',
  },
  {
    n: 2,
    d: 'PREP',
    m: 0,
    q: 'A source column contains values like "2026-Q1" and you need a numeric quarter and a numeric year as two separate columns for later modeling. Which Power Query transformation is most direct?',
    o: [
      'Split Column by Delimiter',
      'Unpivot Columns',
      'Replace Values on the whole table',
      'Change data type to Date only',
    ],
    a: [0],
    x: 'Split Column by Delimiter separa "2026-Q1" en dos columnas usando el guion como separador, dando directamente el año y el trimestre como texto/número editable. Unpivot sirve para convertir columnas en filas (no aplica aquí), y cambiar el tipo a Date fallaría porque "2026-Q1" no es una fecha válida.',
  },
  {
    n: 3,
    d: 'MODEL',
    m: 0,
    q: 'A star schema has a Sales fact table connected to Date, Product, and Customer dimension tables via single-direction (single) cross-filter relationships from each dimension to the fact table. A report needs a measure that counts distinct customers who purchased each product. What is required for this to work correctly with single-direction filters?',
    o: [
      'Nothing extra: filtering Product automatically filters Customer through Sales in a star schema',
      'The relationship must be changed to bidirectional between Product and Customer directly',
      'A DAX measure using CALCULATE with cross-filtering, or a bidirectional relationship on the Sales-Customer link, since filters need to flow from Product through Sales to Customer',
      'Customer and Product must be merged into a single dimension table',
    ],
    a: [0],
    x: 'En un esquema en estrella con relaciones de una sola dirección desde cada dimensión hacia la tabla de hechos, filtrar por Producto sí propaga el filtro a la tabla Sales, y una medida como DISTINCTCOUNT(Sales[CustomerID]) evaluada en ese contexto respeta ese filtro sin necesitar nada adicional -- el flujo de filtro dimensión→hechos es automático y es precisamente el propósito del modelo estrella. No hace falta bidireccionalidad ni fusionar tablas.',
  },
  {
    n: 4,
    d: 'MODEL',
    m: 0,
    q: "You write a measure YoY Sales = CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date])). For this to return correct results, what must be true about the Date table?",
    o: [
      'It must be marked as a Date table with a contiguous, unbroken range of dates',
      'It must contain only weekdays',
      'It must be a calculated table generated with SUMMARIZE',
      'It must have a relationship marked as inactive',
    ],
    a: [0],
    x: 'Las funciones de time intelligence como SAMEPERIODLASTYEAR requieren una tabla de fechas marcada explícitamente como Date table (Mark as Date Table), con una columna de tipo fecha única y sin huecos en el rango de fechas cubierto; si faltan días, los cálculos de periodo anterior quedan incorrectos o incompletos. No es necesario que sean solo días laborables ni que la relación esté inactiva.',
  },
  {
    n: 5,
    d: 'VIS',
    m: 0,
    q: 'A report page has a bar chart and a map visual. You want selecting a bar to highlight (not filter out) the corresponding data in the map, keeping the rest of the map visible in a dimmed state. Which interaction mode should you configure?',
    o: ['Filter', 'Highlight', 'None', 'Drillthrough'],
    a: [1],
    x: 'El modo de interacción "Highlight" resalta los elementos relacionados en el otro visual mientras mantiene visible el resto en un tono atenuado, ideal para comparar la selección contra el total. "Filter" en cambio eliminaría por completo del otro visual los datos que no coincidan con la selección, y "None" desactiva la interacción entre ambos visuales.',
  },
  {
    n: 6,
    d: 'VIS',
    m: 0,
    q: 'Stakeholders want to click a specific customer in a summary table and navigate to a detail page pre-filtered to just that customer, without affecting other pages in the report. Which feature should you implement?',
    o: ['Bookmarks', 'Drillthrough', 'Q&A visual', 'Tooltip pages'],
    a: [1],
    x: 'Drillthrough permite click-derecho (o click configurado) sobre un valor para navegar a una página de detalle que se filtra automáticamente por ese valor, sin tocar el estado de otras páginas del informe. Los bookmarks capturan un estado de vista concreto pero no filtran dinámicamente por el elemento clicado, y las tooltip pages solo se muestran al pasar el cursor, sin navegación.',
  },
  {
    n: 7,
    d: 'MANAGE',
    m: 0,
    q: "You need different sales regions to see only their own region's rows in the same published report, without creating a separate copy of the report per region. Which Power BI feature addresses this?",
    o: [
      'Row-level security (RLS) with DAX filter expressions per role',
      'Workspace-level access control only',
      'Publishing a separate .pbix file for each region',
      'Personal bookmarks saved by each viewer',
    ],
    a: [0],
    x: 'La seguridad a nivel de fila (RLS) define roles con expresiones DAX que filtran las tablas según el usuario autenticado (por ejemplo, [Region] = USERPRINCIPALNAME()), aplicando el mismo informe publicado con datos distintos según quién lo vea. El control de acceso a nivel de workspace solo decide quién puede abrir el informe, no qué filas ve dentro de él.',
  },
  {
    n: 8,
    d: 'MANAGE',
    m: 0,
    q: 'A dataset connects to an on-premises SQL Server database. For scheduled refresh to succeed in the Power BI service, what is required?',
    o: [
      'An on-premises data gateway installed and configured with that data source registered',
      'The report must use DirectQuery exclusively',
      'The SQL Server must be migrated to Azure first',
      'Nothing extra: scheduled refresh works for on-premises sources by default',
    ],
    a: [0],
    x: 'El gateway de datos local (on-premises data gateway) actúa como puente seguro entre el servicio Power BI en la nube y fuentes de datos locales; sin él registrado con esa fuente concreta, la actualización programada no puede alcanzar el SQL Server on-premises. Esto aplica tanto a Import como a DirectQuery, y no requiere migrar la base de datos a Azure.',
  },
];

import type { RawQuestion } from '@/quiz/quiz.types';

/**
 * Sourced from Topic 1 of a third-party PL-300 exam-dump PDF (ExamTopics
 * style), rewritten in Claude's own words -- not a verbatim reproduction.
 * Every answer was cross-checked against Power BI's actual documented
 * behavior rather than trusting the dump's own "Correct Answer" label
 * blindly: several of that dump's official answers disagreed with both
 * the community vote and with how the referenced feature actually works
 * (see inline notes below), so this file follows the technically correct
 * answer in those cases.
 *
 * HOTSPOT and DRAG DROP items (which don't map onto this app's flat
 * single/multi-select schema) were rewritten as single-select questions
 * whose options are complete combinations/sequences, with only the fully
 * correct one marked correct.
 *
 * 4 questions from this topic (original #19, #20, #21, #24) were left out
 * of this batch: their correct answer depends on reading specific values
 * (a checkbox state, an exact error message, column names) only visible
 * in a screenshot exhibit that could not be visually verified this pass.
 * No images are attached to any question in this file yet -- see the
 * upload-question-images script and the `image` field on RawQuestion for
 * how to wire them in once exhibits are confirmed.
 */
export const exam307: RawQuestion[] = [
  {
    n: 1,
    d: 'MODEL',
    m: 0,
    q: 'Vas a crear un modelo de Power BI con las tablas Sales, Date, Customer y SalesAggregate, relacionadas entre sí (Sales y SalesAggregate se conectan a Date y Customer). Los requisitos de refresco son: Customer diario, Date cada tres años, Sales casi en tiempo real, y SalesAggregate semanal. Necesitas minimizar los tiempos de carga de los visuales y asegurar que los datos se carguen según esos requisitos. ¿Qué storage mode debe usar cada tabla?',
    o: [
      'Customer: Dual · Date: Dual · Sales: DirectQuery · SalesAggregate: Import',
      'Customer: Import · Date: Import · Sales: DirectQuery · SalesAggregate: Import',
      'Customer: DirectQuery · Date: DirectQuery · Sales: DirectQuery · SalesAggregate: Import',
      'Customer: Dual · Date: Dual · Sales: Import · SalesAggregate: DirectQuery',
    ],
    a: [0],
    x: 'Sales necesita DirectQuery para reflejar datos casi en tiempo real. SalesAggregate, con refresco semanal poco frecuente, puede ir en Import para minimizar tiempos de carga. Las tablas de dimensión (Customer, Date) se configuran en Dual: actúan como caché o como DirectQuery según el contexto de la consulta, lo que reduce las relaciones limitadas entre tablas Import y DirectQuery y mejora el rendimiento general.',
  },
  {
    n: 2,
    d: 'PREP',
    m: 0,
    q: 'Tienes una app de gestión de proyectos alojada completamente en Microsoft Teams, desarrollada con Microsoft Power Apps. Necesitas crear un reporte de Power BI que se conecte a esa app. ¿Qué conector debes elegir?',
    o: ['Microsoft Teams Personal Analytics', 'SQL Server database', 'Dataverse', 'Dataflows'],
    a: [2],
    x: 'Las apps creadas con Power Apps almacenan sus datos en Microsoft Dataverse, por lo que ese es el conector correcto para acceder a los datos de una app de gestión de proyectos hospedada en Teams. Microsoft Teams Personal Analytics es un conector distinto orientado a métricas de uso de Teams, no a los datos de la app en sí.',
  },
  {
    n: 3,
    d: 'PREP',
    m: 0,
    q: 'Publicas un reporte de Power BI para el equipo de ventas que importa datos desde un Excel en una carpeta de SharePoint. El modelo de datos ya contiene varias medidas. Necesitas crear un nuevo reporte a partir de esos datos existentes, minimizando el esfuerzo de desarrollo. ¿Qué tipo de origen de datos debes usar?',
    o: ['Un dataset de Power BI', 'Una carpeta de SharePoint', 'Power BI dataflows', 'Un libro de Excel'],
    a: [0],
    x: 'Como el dataset ya publicado contiene las medidas necesarias, conectarse a él como "Power BI dataset" (por ejemplo vía Get Data > Power BI datasets) reutiliza ese modelo completo sin reconstruir nada, minimizando el esfuerzo. Reconectar a la carpeta de SharePoint o al Excel obligaría a recrear las medidas desde cero.',
  },
  {
    n: 4,
    d: 'PREP',
    m: 0,
    q: 'Importas a Power Query dos tablas de Excel, Customer (Customer ID, Customer Name, Phone, Email Address, Address ID) y Address (Address ID, Address Line 1/2, City, State/Region, Country, Postal Code). Cada Customer ID es un cliente único y cada Address ID es una dirección única. Necesitas una consulta con una fila por cliente que incluya City, State/Region y Country. ¿Qué debes hacer?',
    o: [
      'Combinar (merge) las tablas Customer y Address.',
      'Agrupar (group by) las tablas Customer y Address por la columna Address ID.',
      'Transponer las tablas Customer y Address.',
      'Anexar (append) las tablas Customer y Address.',
    ],
    a: [0],
    x: 'Merge Queries une dos tablas por una columna en común (Address ID), agregando las columnas de una a la otra sin duplicar filas, ya que cada Customer ID mapea a un único Address ID. Append apilaría filas en lugar de agregar columnas, y no aplica aquí.',
  },
  {
    n: 5,
    d: 'PREP',
    m: 0,
    q: 'Tienes dos bases Azure SQL con las mismas tablas y columnas. Para cada una, creas una consulta que trae datos de una tabla Customer. Necesitas combinar ambas tablas Customer en una sola, minimizando el tamaño del modelo y soportando el refresco programado en powerbi.com. ¿Qué debes hacer?',
    o: [
      'Usar "Append Queries as New" para combinar ambas consultas Customer en una nueva consulta, y deshabilitar la carga de las consultas originales al modelo.',
      'Usar "Merge Queries" para combinar ambas consultas Customer por su clave común.',
      'Transponer ambas consultas Customer antes de combinarlas.',
      'Cargar ambas consultas Customer al modelo tal cual y combinarlas con una medida DAX.',
    ],
    a: [0],
    x: '"Append Queries as New" apila las filas de ambas tablas Customer (mismo esquema) en una consulta nueva. Deshabilitar la carga ("Enable Load") de las dos consultas intermedias evita que ocupen espacio en el modelo, minimizando su tamaño, ya que solo la consulta combinada final necesita cargarse.',
  },
  {
    n: 6,
    d: 'PREP',
    m: 0,
    q: 'En Power Query Editor tienes tres consultas: ProductCategory, ProductSubCategory y Product. Cada Product tiene una ProductSubCategory, pero no toda ProductSubCategory tiene una ProductCategory padre. Necesitas combinar las tres en una sola consulta con el mejor rendimiento posible. ¿Cómo debes combinarlas?',
    o: [
      'Product + ProductSubCategory con Inner join, y el resultado + ProductCategory con Left Outer join.',
      'Product + ProductSubCategory con Left Outer join, y el resultado + ProductCategory con Inner join.',
      'Las tres combinadas con Full Outer join.',
      'Las tres combinadas con Append Queries.',
    ],
    a: [0],
    x: 'Como todo Product tiene ProductSubCategory, un Inner join entre ambas es seguro (no se pierde ninguna fila). Como no toda ProductSubCategory tiene ProductCategory padre, un Left Outer join hacia ProductCategory conserva todas las filas del resultado anterior aunque no haya categoría padre.',
  },
  {
    n: 7,
    d: 'PREP',
    m: 0,
    q: 'Construyes un reporte con datos de una base Azure SQL llamada erp1, importando tablas de Orders, Order Line Items y Products. Necesitas analizar el valor total de pedidos en el tiempo y los pedidos por atributos de producto, minimizando los tiempos de actualización al interactuar con los visuales. ¿Qué debes hacer primero?',
    o: [
      'Desde Power Query, combinar (merge) las consultas Orders y Order Line Items.',
      'Desde Power Query, combinar las consultas Order Line Items y Products.',
      'Crear una columna calculada en DAX que agregue una lista de categorías de producto a la tabla Orders.',
      'Calcular con DAX el número de pedidos por producto.',
    ],
    a: [0],
    x: 'Combinar Orders con Order Line Items en Power Query, antes de cargar el modelo, reduce el número de tablas y relaciones que Power BI debe resolver en cada interacción, mejorando el rendimiento de los visuales frente a resolverlo con columnas calculadas o medidas DAX en tiempo de consulta.',
  },
  {
    n: 8,
    d: 'PREP',
    m: 0,
    q: 'Un sitio de SharePoint Online tiene varias bibliotecas de documentos. Una contiene reportes de manufactura en Excel, todos con la misma estructura de datos. Necesitas cargar solo esos reportes a una única tabla para análisis. ¿Qué debes hacer?',
    o: [
      'Obtener datos desde una carpeta de SharePoint, ingresar la URL del sitio y usar Combine & Load.',
      'Obtener datos desde una lista de SharePoint, ingresar la URL del sitio y usar Combine & Transform.',
      'Obtener datos desde una carpeta de SharePoint, ingresar la URL del sitio, seleccionar Transform y filtrar por la ruta de la biblioteca.',
      'Obtener datos desde una lista de SharePoint y usar Combine & Load.',
    ],
    a: [0],
    x: 'El conector "SharePoint folder" con la opción "Combine & Load" carga y combina automáticamente todos los archivos con estructura compatible dentro de la carpeta indicada directamente al modelo, sin pasos manuales adicionales. El conector de "lista" de SharePoint no aplica a bibliotecas de documentos con archivos Excel.',
  },
  {
    n: 9,
    d: 'PREP',
    m: 0,
    q: 'Un libro de Excel tiene dos hojas, Sheet1 (Table1) y Sheet2 (Table2), cada una con una columna de productos. Necesitas usar Power Query Editor para combinar los productos de ambas tablas en una sola columna sin valores duplicados. ¿Qué tres acciones realizas, en orden?',
    o: [
      'Referenciar Table1 en una nueva consulta, anexar (append) Table2, y eliminar duplicados de la columna de productos.',
      'Combinar (merge) Table1 y Table2 por la columna de productos, y eliminar duplicados.',
      'Transponer Table1 y Table2, y luego anexarlas.',
      'Anexar Table1 y Table2, y agrupar (group by) por la columna de productos sumando cantidades.',
    ],
    a: [0],
    x: 'Para unir dos listas de la misma columna en una sola sin duplicados, el patrón estándar es: crear una consulta que referencie la primera tabla, usar Append Queries para apilar la segunda tabla debajo, y luego aplicar Remove Duplicates sobre la columna combinada. Merge combinaría columnas horizontalmente, no es lo que se pide.',
  },
  {
    n: 10,
    d: 'PREP',
    m: 0,
    q: 'Un CSV de quejas de clientes tiene una columna Logged con fecha y hora en el formato "2018-12-31 at 08:59". Necesitas analizar las quejas por fecha usando una jerarquía de fechas incorporada. ¿Qué debes hacer?',
    o: [
      'Dividir la columna Logged usando "at" como delimitador y fijar el tipo de la columna de fecha resultante como Date.',
      'Cambiar directamente el tipo de dato de la columna Logged a Date.',
      'Aplicar una transformación que extraiga los primeros 11 caracteres de Logged.',
      'Aplicar una transformación que extraiga los últimos 11 caracteres de Logged y fijar el tipo como Date.',
    ],
    a: [0],
    x: 'Split Column by Delimiter usando "at" separa limpiamente la fecha de la hora en columnas distintas; al fijar la columna de fecha resultante como tipo Date, Power BI genera automáticamente la jerarquía de fechas. Cambiar el tipo de Logged directamente a Date falla porque la columna combina fecha y hora en texto libre, y extraer una cantidad fija de caracteres es una solución frágil frente a dividir por el delimitador real.',
  },
  {
    n: 11,
    d: 'PREP',
    m: 0,
    q: 'Tienes un archivo Excel en una carpeta de Microsoft OneDrive. Debe importarse a un dataset de Power BI, y necesitas asegurar que ese dataset pueda refrescarse en powerbi.com (sin depender de un gateway local). ¿Qué dos conectores puedes usar? Cada respuesta es una solución completa.',
    o: [
      'Excel Workbook (apuntando a la URL en línea del archivo) y SharePoint folder.',
      'Excel Workbook (apuntando a la ruta local sincronizada) y Folder.',
      'Text/CSV y Web.',
      'Folder y Web.',
    ],
    a: [0],
    x: 'OneDrive está respaldado por SharePoint, por lo que el conector "SharePoint folder" accede al archivo en la nube y soporta refresco en el Servicio sin gateway. El conector "Excel Workbook" también funciona sin gateway si se configura con la URL en línea del archivo (no una ruta local sincronizada, que sí requeriría gateway). El conector "Folder" genérico está pensado para rutas de sistema de archivos locales/de red, no para OneDrive.',
  },
  {
    n: 12,
    d: 'PREP',
    m: 0,
    q: 'Estás perfilando datos en Power Query Editor. La tabla Reports tiene una columna State, y el panel de distribución y calidad de datos muestra 69 valores distintos y 4 valores únicos (que aparecen solo una vez). ¿Qué significan esos dos números?',
    o: [
      '69 es el conteo de valores distintos (diferentes) en la columna, y 4 es el conteo de valores únicos (que aparecen exactamente una vez).',
      '69 es el número total de filas de la tabla, y 4 es el número de columnas.',
      '69 es el número de valores válidos, y 4 es el número de valores con error.',
      '69 y 4 son ambos el conteo de valores nulos en distintas vistas del perfilado.',
    ],
    a: [0],
    x: 'En Power Query, Column Distribution reporta el conteo de valores "distinct" (cuántos valores diferentes existen en la columna) y "unique" (cuántos de esos valores aparecen exactamente una vez). No representan el total de filas/columnas ni la validez de los datos, que se ven en Column Quality.',
  },
  {
    n: 13,
    d: 'PREP',
    m: 0,
    q: 'Tienes dos CSV, Products (ProductID, ProductName, SupplierID, CategoryID) y Categories (CategoryID, CategoryName, CategoryDescription). Los importas a Power Query Editor y necesitas un único dataset con una tabla Product que incluya ProductID, ProductName, SupplierID, CategoryID, CategoryName y CategoryDescription. ¿Cómo combinas las consultas y qué haces con la consulta Categories?',
    o: [
      'Combinar (merge) Products con Categories por CategoryID, y deshabilitar la carga (Enable Load) de la consulta Categories.',
      'Anexar (append) Products y Categories, y deshabilitar la carga de Products.',
      'Combinar Products con Categories por ProductID, y mantener ambas consultas cargadas al modelo.',
      'Transponer Categories antes de combinarla con Products.',
    ],
    a: [0],
    x: 'Como se necesita agregar columnas de Categories a Products (no apilar filas), corresponde un Merge por la clave común CategoryID. Como Categories solo se usa como paso intermedio para enriquecer Products y no se necesita como tabla independiente en el modelo final, se deshabilita su carga para no duplicar datos en el dataset.',
  },
  {
    n: 14,
    d: 'MODEL',
    m: 0,
    q: 'Una base Azure SQL contiene transacciones de venta y se actualiza con frecuencia. Necesitas generar reportes para detectar transacciones fraudulentas, con los datos visibles a los 5 minutos de cada actualización. ¿Cómo debes configurar la conexión de datos?',
    o: [
      'Fijar el modo de conectividad de datos en DirectQuery.',
      'Fijar el modo de conectividad de datos en Import.',
      'Agregar una sentencia SQL personalizada.',
      'Ajustar el "Command timeout in minutes".',
    ],
    a: [0],
    x: 'DirectQuery no importa ni copia datos: cada visual consulta el origen en el momento de la interacción, por lo que siempre refleja el estado actual de la base, cumpliendo el requisito de visibilidad a los 5 minutos sin depender de un refresco programado.',
  },
  {
    n: 15,
    d: 'PREP',
    m: 0,
    q: 'Tienes una carpeta con 100 archivos CSV. Necesitas exponer los metadatos de esos archivos como un único dataset en Power BI, sin almacenar el contenido de los CSV. ¿Qué tres acciones realizas, en orden?',
    o: [
      'Get Data > Folder, ingresar la ruta y elegir Transform Data; en Power Query Editor, expandir la columna Attributes; y combinar (Combine Files) solo si hiciera falta el contenido — aquí NO se combina la columna Content.',
      'Get Data > Folder, elegir Combine & Load directamente para cargar el contenido de todos los archivos.',
      'Get Data > Text/CSV, importar cada archivo individualmente, y anexarlos (append) en una consulta.',
      'Get Data > Folder, expandir la columna Content para ver el contenido de cada archivo, y eliminar duplicados.',
    ],
    a: [0],
    x: 'El conector Folder expone metadatos (nombre, extensión, fecha, ruta) por archivo sin necesidad de abrir su contenido. Expandiendo la columna Attributes se obtienen esos metadatos como columnas, cumpliendo el requisito de no almacenar el contenido de los CSV, a diferencia de "Combine & Load" o de expandir la columna Content, que sí cargarían los datos reales de cada archivo.',
  },
  {
    n: 16,
    d: 'MODEL',
    m: 0,
    q: 'Un dataflow en Power BI usa DirectQuery para acceder a tablas de un SQL Server on-premises, con el Enhanced Dataflows Compute Engine activado. Necesitas usar ese dataflow en un reporte minimizando el procesamiento en línea y los tiempos de cálculo/renderizado, incluyendo datos del año en curso hasta el día anterior. ¿Qué debes hacer?',
    o: [
      'Crear una conexión al dataflow en modo Import y programar un refresco diario.',
      'Crear una conexión al dataflow en modo DirectQuery.',
      'Crear una conexión al dataflow en modo DirectQuery y configurar un gateway para el dataset.',
      'Crear una conexión al dataflow en modo Import y usar Power Automate para refrescar cada hora.',
    ],
    a: [0],
    x: 'Un refresco diario es suficiente para el requisito de "hasta el día anterior", y el modo Import minimiza el procesamiento en línea y los tiempos de cálculo/renderizado al cachear los datos, a diferencia de DirectQuery, que consultaría el origen en cada interacción del visual. Refrescar cada hora es innecesario para este requisito y añade complejidad sin beneficio.',
  },
  {
    n: 17,
    d: 'MANAGE',
    m: 0,
    q: 'Publicas un dataset con datos de un SQL Server on-premises que debe refrescarse diariamente. Necesitas asegurar que el servicio de Power BI pueda conectarse a la base y refrescar el dataset. ¿Qué cuatro acciones realizas, en orden?',
    o: [
      'Instalar un gateway de datos on-premises; en Power BI Service, agregar el origen de datos al gateway; configurar las credenciales del origen; y asignar el dataset a ese gateway y programar el refresco.',
      'Programar el refresco del dataset; instalar el gateway; agregar el origen al gateway; y configurar las credenciales.',
      'Configurar las credenciales del origen; instalar el gateway; programar el refresco; y agregar el origen al gateway.',
      'Instalar el gateway; programar el refresco directamente; y configurar las credenciales después.',
    ],
    a: [0],
    x: 'El orden correcto es: instalar el gateway en una máquina con acceso a la base on-premises, registrar el origen de datos dentro de ese gateway, proporcionar las credenciales de conexión, y finalmente vincular el dataset al gateway configurado y programar su refresco. Programar el refresco antes de tener el gateway y las credenciales listos no funcionaría.',
  },
  {
    n: 18,
    d: 'PREP',
    m: 0,
    q: 'Intentas conectar Power BI Desktop a una base de datos Cassandra. En la lista de conectores de Get Data no existe un conector específico para Cassandra. Necesitas elegir un conector alternativo. ¿Cuál?',
    o: ['ODBC', 'Microsoft SQL Server database', 'OLE DB', 'OData'],
    a: [0],
    x: 'Cuando no existe un conector nativo para un origen de datos, ODBC es el mecanismo genérico estándar para conectar Power BI (vía un driver ODBC del proveedor, en este caso de Cassandra) cuando el origen lo soporta. Los otros conectores están pensados para tecnologías específicas que no aplican a Cassandra.',
  },
  {
    n: 19,
    d: 'PREP',
    m: 0,
    q: 'Estás creando una consulta para usarla como dimensión Country en un star schema. Los datos de origen incluyen columnas de Country y City, con múltiples filas repitiendo el mismo país para distintas ciudades. Necesitas que la dimensión contenga una lista de países únicos. ¿Qué dos acciones realizas? Cada una aporta parte de la solución.',
    o: [
      'Eliminar la columna City.',
      'Eliminar la columna Country.',
      'Eliminar duplicados de toda la tabla (todas las columnas).',
      'Eliminar duplicados solo de la columna City.',
    ],
    a: [0],
    x: 'Al eliminar la columna City, cada país deja de repetirse por cada ciudad asociada; luego, eliminar duplicados sobre la columna Country (que queda como única columna relevante) produce la lista de países únicos requerida. Eliminar duplicados sobre toda la tabla no serviría mientras la columna City siga presente, ya que las combinaciones país-ciudad seguirían siendo distintas entre sí.',
  },
  {
    n: 20,
    d: 'PREP',
    m: 0,
    q: 'Tienes un dataset con una columna Discount donde algunas filas presentan valores de error. Necesitas limpiarlo y transformarlo de forma que se mantengan todas las filas, y los valores de error en Discount se reemplacen por 0.05, minimizando el esfuerzo administrativo. ¿Qué debes hacer en Power Query Editor?',
    o: [
      'Seleccionar la columna Discount y usar "Replace Errors" con el valor 0.05.',
      'Usar "Remove Errors" sobre la columna Discount.',
      'Usar "Keep Errors" sobre la columna Discount.',
      'Editar la consulta desde el grupo "Query Errors" eliminando las filas con error.',
    ],
    a: [0],
    x: '"Replace Errors" sustituye directamente cada valor de error por el valor indicado (0.05) en un solo paso, conservando todas las filas de la tabla. "Remove Errors" eliminaría esas filas por completo, incumpliendo el requisito de mantenerlas todas.',
  },
  {
    n: 21,
    d: 'PREP',
    m: 0,
    q: 'Tienes un CSV de quejas de clientes con una columna Logged en formato "2018-12-31 at 08:59". Necesitas analizar las quejas por fecha usando una jerarquía de fechas incorporada. ¿Qué debes hacer?',
    o: [
      'Dividir la columna Logged usando "at" como delimitador.',
      'Cambiar directamente el tipo de dato de Logged a Date.',
      'Aplicar la función Parse de las transformaciones de datos a la columna Logged.',
      'Crear una columna por ejemplo (column by example) que empiece con "2018-12-31".',
    ],
    a: [0],
    x: 'Igual que en escenarios equivalentes de este mismo tema, dividir la columna por el delimitador "at" separa la fecha del texto de hora en una columna propia, que luego puede tipificarse como Date para habilitar la jerarquía de fechas incorporada. Cambiar el tipo directamente falla porque el contenido combina fecha y hora como texto libre.',
  },
  {
    n: 22,
    d: 'PREP',
    m: 0,
    q: 'Tienes dos libros de Excel en una carpeta de OneDrive, cada uno con una tabla Sales de igual estructura. Vas a usar Power BI para combinar ambas tablas Sales en una y crear visuales, asegurando poder publicar un reporte y un dataset por separado (composite/live connection). ¿Qué storage mode corresponde al archivo de reporte y cuál al archivo de dataset?',
    o: [
      'El archivo de dataset importa y combina los datos en modo Import; el archivo de reporte se conecta a ese dataset publicado mediante Live Connection.',
      'Ambos archivos usan DirectQuery hacia los libros de Excel directamente.',
      'El archivo de dataset usa DirectQuery; el archivo de reporte usa Import.',
      'Ambos archivos usan Dual storage mode.',
    ],
    a: [0],
    x: 'Para publicar un dataset y un reporte como artefactos separados y reutilizables, el dataset se construye importando y combinando los datos (Import), se publica, y luego el archivo de reporte se conecta a ese dataset ya publicado mediante una conexión en vivo (Live Connection), en lugar de volver a importar los datos.',
  },
  {
    n: 23,
    d: 'PREP',
    m: 0,
    q: 'Usas Power Query para importar dos tablas de una base Azure SQL, Order Header y Order Details, relacionadas por una columna Order ID en ambas. Necesitas combinarlas en una sola consulta que contenga las columnas únicas de cada tabla. ¿Qué debes seleccionar en Power Query Editor?',
    o: ['Merge queries', 'Combine files', 'Append queries'],
    a: [0],
    x: 'Merge Queries une dos tablas relacionadas por una clave común (Order ID), incorporando las columnas de una a la otra sin duplicar filas. Append apilaría filas de tablas con el mismo esquema, y Combine files se usa para combinar archivos de una carpeta, ninguno aplica aquí.',
  },
  {
    n: 24,
    d: 'PREP',
    m: 0,
    q: 'Tienes un CSV de quejas de clientes con una columna Logged en formato "2018-12-31 at 08:59". Necesitas analizar las quejas por fecha usando una jerarquía de fechas incorporada. ¿Qué debes hacer?',
    o: [
      'Dividir la columna Logged usando "at" como delimitador.',
      'Aplicar una transformación que extraiga los últimos 11 caracteres de Logged y fijar el tipo de la nueva columna como Date.',
      'Cambiar directamente el tipo de dato de Logged a Date.',
      'Aplicar la función Parse de las transformaciones de fecha a la columna Logged.',
    ],
    a: [0],
    x: 'Dividir por el delimitador "at" separa limpiamente la fecha de la hora, permitiendo tipificar la columna resultante como Date y habilitar la jerarquía de fechas incorporada. Extraer una cantidad fija de caracteres es frágil si el formato varía, y cambiar el tipo directamente sobre el texto combinado no funciona.',
  },
  {
    n: 25,
    d: 'MANAGE',
    m: 0,
    q: 'Tienes dos archivos de Excel en una carpeta de OneDrive, cada uno con una tabla Sales de la misma estructura. Debes actualizar un PBIX que importa datos desde un archivo Excel en una carpeta compartida de red local, después de que ese archivo se movió a una nueva ubicación. ¿Qué tres formas puedes usar para lograrlo? Cada una es una solución completa.',
    o: [
      'Desde Data source settings en Power BI Desktop, actualizar la ruta del archivo; desde la barra de fórmulas de Power Query Editor, editar la ruta del paso aplicado; y desde el Advanced Editor, actualizar la ruta en el código M.',
      'Desde Datasets en Power BI Service, configurar las credenciales del origen; desde Data source settings en Desktop, actualizar la ruta; y desde el Advanced Editor, actualizar el código M.',
      'Desde Current File en Power BI Desktop, configurar Data Load; desde la barra de fórmulas, editar la ruta; y desde Datasets en el Servicio, configurar credenciales.',
      'Solo es posible actualizando el código M desde el Advanced Editor.',
    ],
    a: [0],
    x: 'La ruta del archivo puede actualizarse desde Data source settings en Power BI Desktop (cambia el paso Source automáticamente), editando directamente el paso Source en la barra de fórmulas, o editando el código M equivalente en el Advanced Editor — las tres apuntan al mismo paso subyacente. Configurar credenciales en el Servicio no cambia la ruta del archivo, y "Data Load" en Current File no controla rutas de archivo.',
  },
  {
    n: 26,
    d: 'PREP',
    m: 0,
    q: 'Tienes datos en una hoja de Excel. Necesitas usar Power Query para limpiar y transformar el dataset de forma que, si la columna discount devuelve un error, se use 0.05, se mantengan todas las filas, y se minimice el esfuerzo administrativo. ¿Qué debes hacer en Power Query Editor?',
    o: [
      'Seleccionar Replace Errors.',
      'Editar la consulta desde el grupo Query Errors.',
      'Seleccionar Remove Errors.',
      'Seleccionar Keep Errors.',
    ],
    a: [0],
    x: 'Replace Errors sustituye en un único paso cada valor de error por 0.05, conservando el resto de la fila y todas las filas de la tabla, siendo la opción de menor esfuerzo administrativo frente a eliminarlas o marcarlas.',
  },
  {
    n: 27,
    d: 'MANAGE',
    m: 0,
    q: 'Al ejecutar una consulta en Power Query Editor recibes el mensaje "Datasource.Error: Could not find file." ¿Cuáles son dos causas posibles de este error? Cada una es una solución completa.',
    o: [
      'No tienes permisos sobre el archivo, y el archivo referenciado se movió a una nueva ubicación.',
      'Se usó un nivel de privacidad incorrecto para el origen de datos, y el archivo está bloqueado.',
      'No tienes permisos sobre el archivo, y se usó un nivel de privacidad incorrecto.',
      'El archivo está bloqueado, y el archivo se movió a una nueva ubicación.',
    ],
    a: [0],
    x: '"Could not find file" indica que Power Query no puede localizar el archivo en la ruta esperada: esto ocurre tanto si careces de permisos para acceder a él como si fue movido a otra ubicación (la ruta original ya no existe). Un nivel de privacidad incorrecto o un archivo bloqueado producen errores distintos, no de "archivo no encontrado".',
  },
  {
    n: 28,
    d: 'PREP',
    m: 0,
    q: 'Tienes una carpeta con 50 archivos JSON. Necesitas usar Power BI Desktop para exponer sus metadatos como un único dataset, sin almacenar el contenido de los archivos JSON. ¿Qué tipo de origen de datos usas y qué transformación aplicas?',
    o: [
      'Conector Folder, y eliminar la columna Content.',
      'Conector Web, y expandir la columna Content.',
      'Conector Folder, y expandir la columna Content.',
      'Conector JSON individual por archivo, y anexarlos (append).',
    ],
    a: [0],
    x: 'El conector Folder expone una fila por archivo con columnas de metadatos (nombre, extensión, fecha, tamaño) además de una columna Content con el contenido binario. Eliminar la columna Content deja solo los metadatos, cumpliendo el requisito de no almacenar los datos reales de los archivos JSON.',
  },
];

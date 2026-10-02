# Manual técnico — AutoInfra

## 1. Propósito del documento

Este manual describe la implementación técnica real de AutoInfra en su alcance actual. Su objetivo es facilitar la instalación, ejecución, mantenimiento y comprensión del proyecto sin atribuirle funcionalidades que no existen en el código.

La versión documentada implementa análisis léxico y sintáctico, construcción de AST, recuperación de errores, generación de reportes y una interfaz web integrada con un Backend REST.

Quedan fuera del alcance de esta versión:

- análisis semántico;
- Interpreter o motor de ejecución;
- tabla de símbolos;
- ejecución o simulación de infraestructura;
- estado final de infraestructura;
- bitácora de ejecución;
- errores semánticos o de infraestructura.

El enunciado original solicita explicar un motor de ejecución. Esa parte no se documenta como implementada porque fue excluida del alcance modificado del proyecto. El flujo real termina en el análisis, la construcción del AST y la generación de reportes.

---

## 2. Descripción técnica general

AutoInfra está dividido en dos aplicaciones independientes:

- **Backend:** Node.js + TypeScript + Express. Contiene el analizador Jison, el AST, la API y la generación de reportes.
- **Frontend:** React + TypeScript + Vite. Permite editar archivos `.infra`, abrirlos, descargarlos y enviar su contenido al Backend para análisis.

El flujo general es:

```text
Archivo/código .infra
        ↓
Frontend React
        ↓
POST /analizar
        ↓
Controller Express
        ↓
Parser Jison
        ↓
Tokens + errores léxicos + errores sintácticos + AST
        ↓
Generación de reportes
        ↓
JSON
        ↓
Frontend
        ↓
Resumen + errores + tokens + AST gráfico
```

No existe una etapa posterior de análisis semántico ni de ejecución del AST.

---

## 3. Lenguajes, tecnologías y herramientas

### 3.1 Backend

Tecnologías principales:

- Node.js;
- TypeScript;
- CommonJS;
- Express;
- Jison;
- CORS;
- dotenv;
- `@viz-js/viz`;
- `ts-node`;
- `nodemon` como dependencia de desarrollo.

Versiones declaradas en el proyecto inspeccionado:

| Paquete | Versión declarada |
|---|---|
| `express` | `^5.2.1` |
| `jison` | `^0.4.18` |
| `cors` | `^2.8.6` |
| `dotenv` | `^18.0.3` |
| `@viz-js/viz` | `^3.31.0` |
| `typescript` | `^5.9.3` |
| `ts-node` | `^10.9.2` |

`nodemon` está declarado actualmente como `devDependency`. Su versión exacta debe consultarse en el `package.json` vigente del Backend.

El proyecto no fija una versión exacta de Node.js mediante `engines`, `.nvmrc` o `.node-version`.

### 3.2 Frontend

Tecnologías principales:

- React;
- React DOM;
- TypeScript;
- Vite;
- ESLint;
- APIs del navegador para archivos, `Blob` y Object URLs.

El editor de código actual es un elemento HTML `<textarea>` controlado por React. No se utiliza Monaco Editor ni CodeMirror.

Dependencias declaradas principales:

| Paquete | Versión declarada |
|---|---|
| `react` | `^19.2.8` |
| `react-dom` | `^19.2.8` |
| `vite` | `^8.3.0` |
| `typescript` | `~6.0.2` |
| `@vitejs/plugin-react` | `^6.1.1` |

---

## 4. Arquitectura Backend / Frontend

```text
┌────────────────────────────────────┐
│ Frontend                           │
│ React + TypeScript + Vite          │
│                                    │
│ Editor                             │
│ Nuevo / Abrir / Guardar            │
│ Guardar como / Analizar            │
│ Reportes                           │
└─────────────────┬──────────────────┘
                  │ HTTP / JSON
                  │ POST /analizar
                  ▼
┌────────────────────────────────────┐
│ Backend                            │
│ Express + TypeScript               │
│                                    │
│ Ruta → Controller                  │
│          ↓                         │
│       Parser Jison                 │
│          ↓                         │
│    AST / Tokens / Errores          │
│          ↓                         │
│       Reportes                     │
└────────────────────────────────────┘
```

La lógica léxica y sintáctica reside exclusivamente en el Backend. El Frontend no implementa reglas del lenguaje AutoInfra.

---

## 5. Estructura general del proyecto

La estructura relevante es:

```text
OLC1_Proyecto2_202307764/
├── Backend/
│   ├── .env
│   ├── app.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   │
│   ├── analizador/
│   │   ├── analizador.jison
│   │   ├── analizador.js
│   │   ├── lexer.ts
│   │   └── parser.ts
│   │
│   ├── controllers/
│   │   └── analisis.controller.ts
│   │
│   ├── models/
│   │   └── ast.ts
│   │
│   ├── reports/
│   │   ├── ast.report.ts
│   │   ├── ast.svg.ts
│   │   ├── errores.report.ts
│   │   ├── reportes.service.ts
│   │   ├── reportes.types.ts
│   │   └── tokens.report.ts
│   │
│   └── routes/
│       └── analisis.route.ts
│
├── Frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── App.css
│       ├── index.css
│       │
│       ├── components/
│       │   ├── AnalysisStatus.tsx
│       │   ├── CodeEditor.tsx
│       │   ├── Toolbar.tsx
│       │   └── results/
│       │       ├── AnalysisSummary.tsx
│       │       ├── AstViewer.tsx
│       │       ├── ErrorsTable.tsx
│       │       ├── ResultsPanel.tsx
│       │       └── TokensTable.tsx
│       │
│       ├── services/
│       │   ├── analisis.service.ts
│       │   └── archivo.service.ts
│       │
│       └── types/
│           └── analisis.types.ts
│
└── docs/
    ├── gramatica.md
    ├── manual-tecnico.md
    └── manual-usuario.md
    └── img/
    └── capturas del manual
```

> `Backend/analizador/analizador.js` es un archivo **generado por Jison** y está versionado intencionalmente en Git. No debe considerarse código escrito manualmente. Su fuente es `analizador.jison`.

---

## 6. Backend

### 6.1 Punto de entrada: `Backend/app.ts`

`app.ts` crea el servidor Express y realiza las siguientes tareas:

1. carga las variables de entorno mediante `dotenv.config()`;
2. habilita CORS con `app.use(cors())`;
3. habilita el procesamiento JSON con `app.use(express.json())`;
4. registra `analisisRouter`;
5. obtiene el puerto de `process.env.PORT` con fallback `3000`;
6. inicia el servidor con `app.listen()`.

La variable de entorno usada actualmente es:

```env
PORT=3000
```

### 6.2 Ruta: `routes/analisis.route.ts`

Existe un endpoint funcional para el análisis:

```http
POST /analizar
```

La ruta delega el procesamiento a la función `analizar` del controller.

### 6.3 Controller: `controllers/analisis.controller.ts`

La función principal es:

```ts
analizar(req, res)
```

Su flujo es:

1. extraer `codigo` del cuerpo JSON;
2. verificar que `codigo` sea una cadena;
3. llamar una sola vez a `analizarCodigo(codigo)`;
4. derivar los reportes mediante `generarReportes(resultado)`;
5. devolver el resultado y sus reportes en JSON.

El cuerpo esperado es:

```json
{
  "codigo": "main { print(\"Hola\"); }"
}
```

Si `codigo` no es una cadena, la API responde HTTP `400`.

Los errores léxicos y sintácticos son resultados normales del análisis y se devuelven dentro de HTTP `200`. HTTP `500` se reserva para fallos internos no controlados del Backend.

---

## 7. Analizador léxico

### 7.1 Fuente de las reglas

Las reglas léxicas están definidas en:

```text
Backend/analizador/analizador.jison
```

El archivo `lexer.ts` expone además `analizarLexicamente(codigo)`, una utilidad capaz de ejecutar únicamente el lexer generado. El endpoint `/analizar` no llama esta función por separado: el análisis normal ocurre a través del parser Jison.

### 7.2 Información producida por cada token

Cada token conserva:

```ts
{
    lexema: string;
    tipo: string;
    linea: number;
    columna: number;
    valorProcesado?: string;
}
```

Las líneas y columnas expuestas por el proyecto son base 1.

### 7.3 Categorías léxicas

El lexer reconoce, entre otras categorías:

- tipos: `int`, `float`, `string`, `bool`, `server`, `service`, `database`;
- control: `if`, `else`, `while`, `for`, `break`, `continue`, `return`;
- declaraciones: `function`, `task`, `main`;
- ejecución sintáctica: `run`;
- booleanos: `true`, `false`;
- identificadores;
- enteros, decimales y cadenas;
- operadores aritméticos, relacionales y lógicos;
- delimitadores como paréntesis, llaves, corchetes, punto y coma, coma y punto.

La lista completa de tokens y producciones se encuentra en el entregable de gramática de E3, cuya fuente es `analizador.jison`.

### 7.4 Recuperación léxica

La implementación registra errores sin detener inmediatamente todo el análisis cuando es posible.

Se contemplan explícitamente:

- carácter no reconocido;
- cadena sin cerrar;
- comentario multilínea sin cerrar.

Para un comentario `/* ...` sin cierre, el lexer conserva la línea y columna donde comenzó el comentario para producir el error correspondiente al llegar a EOF.

---

## 8. Analizador sintáctico

### 8.1 Gramática fuente y parser generado

La fuente de la gramática es:

```text
Backend/analizador/analizador.jison
```

Jison genera:

```text
Backend/analizador/analizador.js
```

El archivo generado está versionado en Git para que una versión clonada del repositorio ya disponga del parser correspondiente a la gramática versionada.

La integración con TypeScript ocurre en:

```text
Backend/analizador/parser.ts
```

Este wrapper carga el módulo CommonJS generado y expone:

```ts
analizarCodigo(codigo: string): ResultadoAnalisis
```

### 8.2 Resultado público del analizador

El resultado contiene:

```ts
{
    ast: ProgramNode | null;
    tokens: Token[];
    erroresLexicos: ErrorLexico[];
    erroresSintacticos: ErrorSintactico[];
}
```

### 8.3 Precedencia

La precedencia está codificada mediante niveles de producciones y no mediante directivas `%left`, `%right` o `%nonassoc`.

De menor a mayor precedencia:

```text
||
&&
== !=
< <= > >=
+ -
* / %
! - unario
postfix: llamadas, acceso a propiedad e índices
```

Las operaciones binarias utilizan recursión izquierda. Los operadores unarios utilizan una estructura recursiva que permite su anidamiento.

### 8.4 Restricciones sintácticas relevantes

La implementación real establece, entre otras, las siguientes restricciones:

- el programa contiene declaraciones globales seguidas por `main`;
- `return` requiere una expresión;
- el `for` usa la forma `declaración ; expresión ; asignación`;
- los literales de arreglo no son vacíos;
- las llamadas pueden no tener argumentos;
- como statement independiente solo se admite una expresión que produzca un `CallExpression`;
- un objetivo de asignación debe ser identificador, acceso a propiedad o índice.

Para la gramática completa debe consultarse el archivo Markdown de gramática generado en E3, contrastado directamente contra `analizador.jison`.

---

## 9. Recuperación de errores sintácticos

`parser.ts` reemplaza el manejo de errores de Jison mediante un contexto `yy` que contiene los arreglos de errores y las funciones auxiliares.

La función `parseError` construye errores con:

```ts
{
    tipo: "Sintáctico";
    descripcion: string;
    lexema: string;
    linea: number;
    columna: number;
}
```

La gramática contiene producciones de recuperación asociadas principalmente con:

- `;`;
- `}`;
- continuación con declaraciones globales posteriores.

Existen puntos de recuperación dentro de declaraciones globales, propiedades de recursos, bloques y statements.

Cuando Jison marca un error como recuperable, el wrapper permite que el análisis continúe. También se trata de forma específica el mensaje:

```text
Parsing halted while starting to recover from another error.
```

Ese aborto se considera parte de una recuperación sintáctica ya iniciada únicamente cuando ya se había registrado al menos un error sintáctico. Otros fallos internos se vuelven a lanzar.

---

## 10. Construcción del AST

Las interfaces del AST se encuentran en:

```text
Backend/models/ast.ts
```

El nodo raíz es:

```text
Program
├── declarations[]
└── main
```

Entre los nodos definidos se encuentran:

### Declaraciones y estructura

- `Program`;
- `VariableDeclaration`;
- `ResourceDeclaration`;
- `ResourceProperty`;
- `FunctionDeclaration`;
- `TaskDeclaration`;
- `MainDeclaration`;
- `Parameter`;
- `Block`.

### Statements

- `Assignment`;
- `ExpressionStatement`;
- `IfInstruction`;
- `WhileInstruction`;
- `ForInstruction`;
- `BreakInstruction`;
- `ContinueInstruction`;
- `ReturnInstruction`;
- `RunInstruction`.

### Expresiones

- `LiteralExpression`;
- `IdentifierExpression`;
- `BinaryExpression`;
- `UnaryExpression`;
- `CallExpression`;
- `PropertyAccessExpression`;
- `IndexExpression`;
- `ArrayExpression`.

El AST es exclusivamente estructural. Los nodos no implementan métodos `execute()`, `evaluate()` o equivalentes.

Las interfaces AST pueden ser más generales que algunas producciones concretas de Jison. Para determinar qué sintaxis acepta realmente el lenguaje, la fuente de verdad es `analizador.jison`, no únicamente `models/ast.ts`.

---

## 11. Sistema de reportes

La función central es:

```ts
generarReportes(resultado)
```

ubicada en:

```text
Backend/reports/reportes.service.ts
```

Todos los reportes se construyen a partir del mismo `ResultadoAnalisis`.

### 11.1 Tabla de tokens

`tokens.report.ts` implementa:

```ts
generarReporteTokens(resultado)
```

Cada fila contiene:

- número correlativo;
- lexema;
- tipo de token;
- línea;
- columna.

### 11.2 Reporte de errores

`errores.report.ts` implementa:

```ts
generarReporteErrores(resultado)
```

Combina únicamente:

- errores léxicos;
- errores sintácticos.

Los ordena por línea y columna y asigna un número correlativo.

La columna `codigo` existe en el contrato del reporte, pero su valor actual es `null`. El proyecto no inventa códigos `LEX-xxx` o `SYN-xxx` que no estén definidos por la implementación.

### 11.3 Reporte del AST

`ast.report.ts` implementa:

```ts
generarReporteAST(resultado)
```

El módulo recorre recursivamente el AST y genera:

- una lista de nodos;
- una lista de aristas;
- una representación DOT.

Los nodos reciben identificadores correlativos como `n0`, `n1`, etc. Las etiquetas incluyen información relevante cuando corresponde, por ejemplo el tipo de literal, identificadores, operadores, nombres de recursos o funciones.

Si no existe AST, el reporte utiliza:

```text
nodos   = []
aristas = []
dot     = null
svg     = null
```

### 11.4 SVG del AST

`ast.svg.ts` utiliza `@viz-js/viz`.

El proceso es:

```text
AST
→ nodos/aristas
→ DOT
→ Viz.js, engine "dot"
→ SVG
```

El SVG es generado en el Backend y posteriormente enviado al Frontend.

---

## 12. API REST

### 12.1 Endpoint

```http
POST http://localhost:3000/analizar
Content-Type: application/json
```

### 12.2 Solicitud

```json
{
  "codigo": "main { print(\"Hola AutoInfra\"); }"
}
```

### 12.3 Respuesta de análisis

La estructura conceptual es:

```text
{
    ast,
    tokens,
    erroresLexicos,
    erroresSintacticos,
    reportes: {
        tablaTokens,
        errores,
        ast
    }
}
```

El objeto `reportes.ast` contiene:

```text
nodos
aristas
dot
svg
```

### 12.4 Errores HTTP

- **200:** análisis realizado, incluso cuando existen errores léxicos o sintácticos.
- **400:** el campo `codigo` falta o no es una cadena.
- **500:** error interno real del Backend.

---

## 13. Frontend

### 13.1 Punto de entrada

```text
Frontend/src/main.tsx
```

monta el componente principal `App`.

### 13.2 `App.tsx`

`App` coordina el estado principal:

- contenido del código;
- nombre del archivo;
- resultado del análisis;
- estado del análisis;
- mensaje de error.

También implementa los handlers para:

- cambios en el editor;
- nuevo archivo;
- abrir archivo;
- guardar;
- guardar como;
- analizar.

Al editar, crear un archivo o abrir otro archivo se invalidan los resultados anteriores.

### 13.3 `Toolbar.tsx`

Expone los botones:

```text
Nuevo
Abrir
Guardar
Guardar como
Analizar
```

Durante un análisis deshabilita estas acciones y muestra `Analizando...` en el botón correspondiente.

### 13.4 `CodeEditor.tsx`

Implementa el editor mediante un `<textarea>` controlado. Muestra también el nombre actual del archivo.

### 13.5 `AnalysisStatus.tsx`

Maneja cuatro estados:

```text
sin-analizar
analizando
completado
error
```

El estado de error se presenta en la interfaz bajo el título `Error de comunicación`, incluso cuando el mensaje pueda provenir de una respuesta HTTP del Backend. Este es el comportamiento real actual.

### 13.6 Componentes de resultados

`ResultsPanel.tsx` agrupa:

- `AnalysisSummary`;
- `ErrorsTable`;
- `TokensTable`;
- `AstViewer`.

`AnalysisSummary` muestra cantidad de tokens, errores léxicos, errores sintácticos y disponibilidad del AST.

`ErrorsTable` muestra:

```text
No. | Tipo | Código | Descripción | Línea | Columna
```

Cuando `codigo` es `null`, el Frontend muestra `—`.

`TokensTable` muestra:

```text
No. | Lexema | Token | Línea | Columna
```

`AstViewer` recibe el SVG desde el Backend, crea un `Blob`, genera una Object URL y lo muestra mediante un elemento `<img>`. El Frontend no reconstruye el AST ni genera Graphviz por su cuenta.

---

## 14. Integración Frontend ↔ Backend

La función:

```ts
analizarCodigo(codigo)
```

de:

```text
Frontend/src/services/analisis.service.ts
```

envía una solicitud `fetch` a:

```text
http://localhost:3000/analizar
```

La URL está definida directamente en el servicio Frontend y no proviene de una variable de entorno.

La petición utiliza:

```text
method: POST
Content-Type: application/json
body: { codigo }
```

Si `response.ok` es falso, el servicio intenta leer un JSON con la forma:

```json
{
  "error": "mensaje"
}
```

Si la respuesta no contiene JSON válido, conserva un mensaje HTTP genérico.

El Backend habilita CORS mediante `app.use(cors())`, lo que permite que el servidor Vite de desarrollo consuma la API desde otro origen local.

---

## 15. Manejo de archivos `.infra`

La gestión de archivos se realiza en el navegador. No existe persistencia en el Backend ni base de datos.

Las funciones se encuentran en:

```text
Frontend/src/services/archivo.service.ts
```

### 15.1 Abrir

```ts
leerArchivoInfra(archivo)
```

verifica que el nombre termine en `.infra` y utiliza `archivo.text()` para leer el contenido.

`Toolbar` utiliza un `<input type="file" accept=".infra">` oculto para seleccionar el archivo.

### 15.2 Normalizar nombre

```ts
normalizarNombreInfra(nombre)
```

agrega `.infra` cuando el nombre indicado por el usuario no posee esa extensión.

### 15.3 Guardar

```ts
descargarArchivoInfra(contenido, nombreArchivo)
```

crea un `Blob`, genera una Object URL temporal y provoca una descarga mediante un elemento `<a download>`.

Por esta razón, **Guardar** descarga una copia con el nombre actual; no modifica directamente un archivo físico previamente abierto.

### 15.4 Guardar como

`App.tsx` solicita el nuevo nombre mediante `window.prompt()`, lo normaliza a `.infra` y descarga el contenido con el nuevo nombre.

---

## 16. Instalación y ejecución

Backend y Frontend poseen sus propios `package.json` y deben instalarse por separado.

### 16.1 Requisitos previos

- Node.js compatible con las dependencias del proyecto;
- npm.

El repositorio no fija una versión exacta de Node.js. No debe asumirse una versión no declarada.

### 16.2 Instalar Backend

Desde la carpeta `Backend`:

```bash
npm install
```

### 16.3 Iniciar Backend

```bash
npm run dev
```

El script ejecuta:

```text
nodemon app.ts
```

`nodemon` está incluido como `devDependency` en el estado actual del proyecto.

Con `.env` actual, el servidor utiliza:

```text
http://localhost:3000
```

### 16.4 Regenerar parser Jison

Solo es necesario regenerar el parser cuando se modifica `analizador.jison`:

```bash
npm run parse
```

El script ejecuta conceptualmente:

```text
jison analizador/analizador.jison
→ analizador/analizador.js
```

`analizador.js` está versionado en Git y debe identificarse siempre como archivo generado.

### 16.5 Instalar Frontend

Desde la carpeta `Frontend`:

```bash
npm install
```

### 16.6 Iniciar Frontend

```bash
npm run dev
```

`vite.config.ts` no establece un puerto personalizado; Vite utiliza su configuración de desarrollo correspondiente.

### 16.7 Build del Frontend

```bash
npm run build
```

El script definido es:

```text
tsc -b && vite build
```

### 16.8 Otros scripts Frontend

```bash
npm run lint
npm run preview
```

El Backend posee además un script `test` heredado que únicamente muestra `Error: no test specified` y finaliza con error. No constituye una suite automatizada de pruebas y no debe utilizarse como evidencia de testing.

---

## 17. Archivos y funciones clave

| Archivo | Elemento principal | Responsabilidad |
|---|---|---|
| `Backend/app.ts` | inicialización Express | Middlewares, rutas y servidor HTTP |
| `Backend/routes/analisis.route.ts` | `router.post("/analizar", ...)` | Exponer el endpoint de análisis |
| `Backend/controllers/analisis.controller.ts` | `analizar` | Validar petición, ejecutar análisis y generar reportes |
| `Backend/analizador/analizador.jison` | gramática Jison | Reglas léxicas, sintácticas y acciones de construcción del AST |
| `Backend/analizador/analizador.js` | parser generado | Artefacto CommonJS generado por Jison |
| `Backend/analizador/lexer.ts` | `analizarLexicamente` | Utilidad para ejecutar únicamente el lexer |
| `Backend/analizador/parser.ts` | `analizarCodigo` | Wrapper del parser, contexto y manejo de errores sintácticos |
| `Backend/models/ast.ts` | interfaces AST | Contrato estructural del AST |
| `Backend/reports/tokens.report.ts` | `generarReporteTokens` | Tabla de tokens |
| `Backend/reports/errores.report.ts` | `generarReporteErrores` | Reporte combinado de errores |
| `Backend/reports/ast.report.ts` | `generarReporteAST` | Nodos, aristas y DOT |
| `Backend/reports/ast.svg.ts` | generación SVG | Convertir DOT a SVG con Viz.js |
| `Backend/reports/reportes.service.ts` | `generarReportes` | Coordinar todos los reportes |
| `Frontend/src/App.tsx` | `App` | Estado general y acciones del usuario |
| `Frontend/src/components/Toolbar.tsx` | `Toolbar` | Operaciones Nuevo/Abrir/Guardar/Analizar |
| `Frontend/src/components/CodeEditor.tsx` | `CodeEditor` | Editor `<textarea>` |
| `Frontend/src/components/AnalysisStatus.tsx` | `AnalysisStatus` | Estado visual del análisis |
| `Frontend/src/components/results/ResultsPanel.tsx` | `ResultsPanel` | Agrupar resultados |
| `Frontend/src/components/results/ErrorsTable.tsx` | `ErrorsTable` | Mostrar errores |
| `Frontend/src/components/results/TokensTable.tsx` | `TokensTable` | Mostrar tokens |
| `Frontend/src/components/results/AstViewer.tsx` | `AstViewer` | Mostrar SVG del AST |
| `Frontend/src/services/analisis.service.ts` | `analizarCodigo` | Comunicación HTTP con el Backend |
| `Frontend/src/services/archivo.service.ts` | funciones de archivo | Abrir y descargar `.infra` |
| `Frontend/src/types/analisis.types.ts` | interfaces Frontend | Contrato tipado de solicitud, respuesta y reportes |

---

## 18. Alcance y limitaciones técnicas

Esta sección existe para evitar que el mantenimiento futuro confunda construcciones sintácticas reconocidas con comportamiento de ejecución.

Por ejemplo, el parser puede reconocer:

```infra
start(backend);
deploy(backend, api);
run production;
```

pero la aplicación actual no ejecuta estas acciones ni modifica un estado de infraestructura.

Tampoco comprueba semánticamente, entre otros aspectos:

- declaraciones previas de identificadores;
- compatibilidad de tipos;
- firmas o cantidad de argumentos de funciones;
- uso contextual de `break`, `continue` o `return`;
- existencia o mutabilidad de propiedades de recursos;
- referencias entre recursos;
- restricciones de dominio de valores.

El análisis se limita deliberadamente a las etapas léxica y sintáctica definidas para esta versión.

---

## 19. Mantenimiento del analizador

Para modificar la sintaxis soportada:

1. editar `Backend/analizador/analizador.jison`;
2. actualizar, si corresponde, los tipos AST en `Backend/models/ast.ts`;
3. ejecutar:

   ```bash
   npm run parse
   ```

4. verificar que `Backend/analizador/analizador.js` se haya regenerado;
5. no editar manualmente el contenido de `analizador.js`;
6. ejecutar las pruebas/regresiones correspondientes antes de versionar el cambio;
7. mantener sincronizado el entregable Markdown de gramática con la sintaxis real.

La sintaxis aceptada debe determinarse desde `analizador.jison`. Las interfaces de `ast.ts` son un contrato estructural y pueden representar variantes más amplias que las producciones actualmente aceptadas.

---

## 20. Resumen del flujo de mantenimiento

```text
Cambios de gramática
        ↓
analizador.jison
        ↓
npm run parse
        ↓
analizador.js generado
        ↓
parser.ts
        ↓
POST /analizar
        ↓
reportes
        ↓
Frontend
```

Para cambios exclusivamente visuales o de manejo de archivos en el Frontend no es necesario regenerar el parser.

---

## 21. Conclusión técnica

La implementación actual de AutoInfra es un analizador cliente-servidor centrado en las fases léxica y sintáctica. El Backend concentra la definición del lenguaje, la construcción del AST y la generación de reportes; el Frontend concentra la edición de archivos `.infra`, la interacción del usuario y la visualización de resultados.

El límite arquitectónico de esta versión es explícito: **no existe análisis semántico ni motor de ejecución**. Toda documentación y mantenimiento posterior debe conservar esa distinción mientras esas funcionalidades continúen fuera del alcance.

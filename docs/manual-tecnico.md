# Manual técnico — AutoInfra

## 1. Propósito del documento

Este manual describe la implementación técnica real de AutoInfra. Su objetivo es facilitar la instalación, ejecución, mantenimiento y comprensión del proyecto sin atribuirle funcionalidades que no existen en el código.

La versión documentada implementa análisis léxico y sintáctico con recuperación de errores, construcción de AST, un **intérprete basado en el patrón Interpreter** (variables, entornos, expresiones, funciones, ciclos, arreglos, tareas, recursos y acciones nativas), simulación determinista de infraestructura, generación de reportes y una interfaz web integrada con un Backend REST.

Por indicación del auxiliar, **no se implementa análisis semántico** de ningún tipo (no existe una etapa de validación estática de tipos, declaraciones o firmas) ni las reglas del enunciado marcadas como excluidas (límites de instrucciones y de profundidad de recursión, validaciones de rangos de propiedades, reglas de estado para `deploy`/`install`/`scale`/`start`/`connect`, etc.). Los únicos errores posteriores al análisis son errores de **ejecución** (por ejemplo, identificador no definido en el entorno) y de **infraestructura** (`INFRA-004`).

---

## 2. Descripción técnica general

AutoInfra está dividido en dos aplicaciones independientes:

- **Backend:** Node.js + TypeScript + Express. Contiene el analizador Jison, el AST, el intérprete, la API y la generación de reportes.
- **Frontend:** React + TypeScript + Vite. Permite editar archivos `.infra`, abrirlos, descargarlos, y enviar su contenido al Backend para analizarlo o ejecutarlo.

El flujo general es:

```text
Archivo/código .infra
        ↓
Frontend React  ──  botón Analizar → POST /api/analyze
                    botón Ejecutar → POST /api/execute
        ↓
Controller Express
        ↓
Parser Jison → tokens + errores léxicos + errores sintácticos + AST
        ↓
¿hay errores sintácticos?
   sí → no se ejecuta (todos los errores se devuelven igualmente)
   no → Intérprete (solo con /api/execute): nodos ejecutables + entornos
        + infraestructura simulada → consola, bitácora, símbolos, estado final
        ↓
Generación de reportes
        ↓
JSON
        ↓
Frontend
        ↓
Resumen + consola + estado de infraestructura + errores
+ tabla de símbolos + bitácora + tokens + AST gráfico
```

Tras el análisis, el AST se transforma en nodos ejecutables que se interpretan (sección 10.1). No existe una etapa de análisis semántico.

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

El proyecto no declara `engines`, `.nvmrc` ni `.node-version`; ver 16.1 para el mínimo efectivo.

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
│ Guardar como / Analizar / Ejecutar │
│ Consola / Infraestructura          │
│ Errores / Símbolos / Bitácora      │
│ Tokens / AST                       │
└─────────────────┬──────────────────┘
                  │ HTTP / JSON
                  │ POST /api/analyze · POST /api/execute
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
│  Intérprete (solo al ejecutar)     │
│  nodos + entornos + recursos       │
│          ↓                         │
│       Reportes                     │
└────────────────────────────────────┘
```

La lógica léxica, sintáctica y de ejecución reside exclusivamente en el Backend. El Frontend no implementa reglas del lenguaje AutoInfra.

---

## 5. Estructura general del proyecto

La estructura relevante es:

```text
OLC1_Proyecto2_202307764/
├── README.md
├── .gitignore
├── Backend/
│   ├── .env
│   ├── app.ts
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   │
│   ├── analizador/
│   │   ├── analizador.jison
│   │   ├── analizador.js            (generado por Jison)
│   │   ├── lexer.ts
│   │   └── parser.ts
│   │
│   ├── interpreter/
│   │   ├── interpreter.ts           (ejecutarPrograma)
│   │   ├── nodes.ts                 (patrón Interpreter + builder)
│   │   ├── environment.ts           (entornos)
│   │   ├── context.ts               (estado de la ejecución)
│   │   ├── values.ts                (valores y conversiones)
│   │   ├── infrastructure.ts        (recursos simulados)
│   │   ├── natives.ts               (funciones nativas)
│   │   └── errors.ts
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
│   │   ├── ejecucion.report.ts      (símbolos, estado final, bitácora)
│   │   ├── errores.report.ts
│   │   ├── reportes.service.ts
│   │   ├── reportes.types.ts
│   │   └── tokens.report.ts
│   │
│   ├── routes/
│   │   └── analisis.route.ts
│   │
│   └── tests/
│       ├── run.ts                   (intérprete)
│       └── errores.ts               (errores léxicos y sintácticos)
│
├── Frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
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
│       │       ├── BitacoraTable.tsx
│       │       ├── ConsolePanel.tsx
│       │       ├── ErrorsTable.tsx
│       │       ├── InfrastructureView.tsx
│       │       ├── ResultsPanel.tsx
│       │       ├── SymbolsTable.tsx
│       │       └── TokensTable.tsx
│       │
│       ├── services/
│       │   ├── analisis.service.ts
│       │   └── archivo.service.ts
│       │
│       └── types/
│           └── analisis.types.ts
│
├── examples/                        (programas .infra de ejemplo)
│
└── docs/
    ├── gramatica.txt                (gramática en BNF)
    ├── manual-tecnico.md
    ├── manual-usuario.md
    └── img/                         (capturas del manual de usuario)
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

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/api/analyze` (alias `/analizar`) | Análisis léxico, sintáctico y AST, sin ejecutar. |
| `POST` | `/api/execute` | Análisis y ejecución. |
| `GET` | `/api/health` | Comprueba que el Backend esté disponible. |

### 6.3 Controller: `controllers/analisis.controller.ts`

Las funciones `analizar` y `ejecutar` comparten el procedimiento `procesar(req, res, ejecutar)`:

1. extraer `codigo` (o el alias `source`) del cuerpo JSON y verificar que sea una cadena;
2. llamar una sola vez a `analizarCodigo(codigo)`;
3. si se pidió ejecutar y **no** hay errores sintácticos (hay AST), llamar a `ejecutarPrograma(ast)`; los errores léxicos no impiden ejecutar porque el lexer descarta el carácter inválido y el AST queda completo; de lo contrario se devuelve `mensajeEjecucion`. El análisis siempre termina antes de decidir, por lo que todos los errores se reportan en ambos casos;
4. derivar los reportes mediante `generarReportes(resultado, ejecucion)`;
5. devolver todo en JSON.

El cuerpo esperado es:

```json
{
  "codigo": "main { print(\"Hola\"); }"
}
```

Si `codigo` no es una cadena, la API responde HTTP `400`. Los errores léxicos, sintácticos, de ejecución y de infraestructura son resultados normales y se devuelven dentro de HTTP `200`. HTTP `500` se reserva para fallos internos no controlados.

---

## 7. Analizador léxico

### 7.1 Fuente de las reglas

Las reglas léxicas están definidas en:

```text
Backend/analizador/analizador.jison
```

El archivo `lexer.ts` expone además `analizarLexicamente(codigo)`, una utilidad capaz de ejecutar únicamente el lexer generado. Los endpoints no llaman esta función por separado: el análisis normal ocurre a través del parser Jison.

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

La lista completa de tokens y producciones se encuentra en `docs/gramatica.txt`, cuya fuente es `analizador.jison`.

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
- los literales de arreglo no son vacíos (un arreglo sin inicializador, como `int[] a;`, sí es válido y queda vacío);
- una declaración puede omitir el inicializador (`int x;`, `server s;`) y recibe el valor por defecto de su tipo;
- las llamadas pueden no tener argumentos;
- como statement independiente solo se admite una expresión que produzca un `CallExpression`;
- un objetivo de asignación debe ser identificador, acceso a propiedad o índice.

Para la gramática completa debe consultarse `docs/gramatica.txt` (BNF), cuyas 44 producciones coinciden con `analizador.jison`.

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

El AST producido por Jison es un árbol de objetos planos serializables (usado por los reportes y la API). Cada nodo ejecutable incluye `line` y `column` (1-based) cuando tiene una posición relevante. La ejecución no recorre estos objetos directamente: se transforman en nodos ejecutables (sección 10.1).

Las interfaces AST pueden ser más generales que algunas producciones concretas de Jison. Para determinar qué sintaxis acepta realmente el lenguaje, la fuente de verdad es `analizador.jison`, no únicamente `models/ast.ts`.

---

Los nodos con posición relevante (declaraciones, llamadas, operadores, instrucciones) incluyen `line` y `column` (1-based), que el intérprete usa para ubicar errores de ejecución y de infraestructura. En una declaración sin inicializador, `initializer` es `null`.

### 10.1 Intérprete (`Backend/interpreter/`)

| Archivo | Responsabilidad |
|---|---|
| `nodes.ts` | Patrón Interpreter: clases `Expresion` (`evaluate(env)`) e `Instruccion` (`execute(env)`) y el *builder* `construirPrograma` que convierte el AST de Jison en nodos ejecutables. |
| `environment.ts` | `Entorno`: cadena de entornos (global, función, task, `main`, bloques) y registro de símbolos. |
| `context.ts` | `Contexto`: estado compartido de una ejecución (funciones, tareas, recursos, conexiones, consola, bitácora, errores, símbolos). |
| `values.ts` | Valores en tiempo de ejecución (`int`, `float`, `string`, `bool`, `null`, arreglos y recursos), valores por defecto, conversiones y formato. |
| `infrastructure.ts` | `Recurso`: servidor, servicio o base de datos simulados con sus propiedades (`status`, `packages`, `host`, `dependsOn`, ...). |
| `natives.ts` | Funciones nativas: `start`, `stop`, `restart`, `install`, `uninstall`, `deploy`, `scale`, `connect`, `disconnect`, `print`, `length`, `status`. |
| `errors.ts` | `ErrorEjecucion` (error de ejecución o de infraestructura con línea y columna). |
| `interpreter.ts` | `ejecutarPrograma(ast)`: crea el contexto, ejecuta y devuelve `ResultadoEjecucion`. |

**Flujo de ejecución (`Programa.ejecutar`):**

1. *Registro*: se crean los recursos (`[OK] Resource 'x' registered`), y se registran funciones y tareas globales.
2. *Inicialización*: se evalúan, en orden de aparición, las variables globales y las propiedades de los recursos.
3. *Main*: se ejecuta el bloque `main` en un entorno hijo del global.

**Entornos.** Cada llamada a función crea un entorno enlazado al entorno **global** (donde se declaran las funciones), por lo que una función no ve las variables locales de quien la llama. `if`, `else`, `while`, `for` (y su cuerpo), tasks y `main` crean entornos propios; una variable local oculta a una externa del mismo nombre sin modificarla. La búsqueda de identificadores recorre la cadena de entornos y falla en tiempo de ejecución si el identificador no existe (no hay análisis previo).

**Control de flujo.** `execute` devuelve una señal (`normal`, `break`, `continue`, `return`); no se usan excepciones para el flujo. Las excepciones (`ErrorEjecucion`) se reservan para errores que detienen la ejecución.

**Valores y operadores.** `+ - *` conservan `int` salvo que participe un `float`; `/` devuelve siempre `float`; `+` con un `string` concatena; `&&` y `||` usan corto circuito; `==`/`!=` comparan números, cadenas, booleanos y recursos por referencia. Al declarar o asignar, un `int` se convierte a `float` si el destino es `float` y un `float` entero se convierte a `int` si el destino es `int` (conversión, no validación). Una declaración sin inicializador usa el valor por defecto del tipo (`0`, `0.0`, `""`, `false`, arreglo vacío, `null`).

**Recursos y acciones nativas.** Los recursos inician en `stopped` (`undeployed` los servicios). `deploy` valida las dependencias `dependsOn` antes de modificar nada: si alguna no existe o no está `running` se registra `INFRA-004`, `deploy` devuelve `false` y el estado no cambia (atomicidad). `stop` sobre un recurso detenido devuelve `false`. Cada acción exitosa agrega una entrada `[OK]` a la bitácora.

**Fuera de alcance por indicación del auxiliar:** análisis semántico, validación de tipos/firmas, límite de 100,000 instrucciones, límite de profundidad de recursión, validación de rangos de propiedades de recursos, y las reglas de `deploy`/`install` sobre servidores detenidos, `scale` con al menos una réplica, `start` sobre recurso activo (devuelve `false` sin advertencia) y `connect` sin duplicados. Consecuencia: un ciclo infinito en el programa fuente no es interrumpido por el intérprete, y `x / 0` produce `Infinity` (JavaScript).

---

## 11. Sistema de reportes

La función central es:

```ts
generarReportes(resultado, ejecucion?)
```

ubicada en:

```text
Backend/reports/reportes.service.ts
```

Los reportes de tokens, errores y AST se construyen a partir del mismo `ResultadoAnalisis`; los de símbolos, estado final y bitácora se agregan solo cuando el programa fue ejecutado (`ResultadoEjecucion`).

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
generarReporteErrores(resultado, erroresEjecucion)
```

Combina:

- errores léxicos;
- errores sintácticos;
- errores de ejecución y de infraestructura (si el programa se ejecutó).

Los léxicos y sintácticos se ordenan por línea y columna; los de ejecución conservan su orden de ocurrencia. Se asigna un número correlativo. Cada fila tiene `tipo` (`Léxico`, `Sintáctico`, `Ejecución` o `Infraestructura`), `codigo`, `descripcion`, `linea` y `columna`.

`codigo` solo tiene valor para `INFRA-004` (dependencia no activa al desplegar); en los demás errores es `null`. El proyecto no inventa códigos que no estén definidos por el enunciado.

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

### 11.5 Tabla de símbolos

`ejecucion.report.ts` → `generarReporteSimbolos(ejecucion)`. Una fila por declaración ejecutada: identificador, categoría (`variable`, `parámetro`, `recurso`, `función`, `task`), tipo, ámbito (`global`, nombre de función/task, `main` o bloques anidados como `main > for > cuerpo`), valor o estado **final**, línea y columna. Las declaraciones que se ejecutan muchas veces (recursión, ciclos) comparten una sola fila con el último valor. Se ordena por posición en el código.

### 11.6 Estado final de infraestructura

`generarReporteEstadoFinal(ejecucion)`. Devuelve `filas` (recurso, tipo, estado, detalles: CPU, memoria y paquetes de un server; motor, versión y puerto de una database; host y réplicas de un service; conexiones) y `infraestructura` con `servers`, `services` y `databases` en formato serializable.

### 11.7 Bitácora

`generarReporteBitacora(ejecucion)`. Cada acción de infraestructura registra una entrada con nivel `OK`, `FAIL` o `ERROR`, mensaje, línea y columna, por ejemplo `[OK] backend started`, `[OK] api scaled to 3 replicas`. Los registros de recursos (`Resource 'x' registered`) se generan al inicio de la ejecución. La consola del Frontend muestra la salida de `print` y la bitácora intercaladas en orden.

---

## 12. API REST

### 12.1 Endpoints

```http
POST http://localhost:3000/api/analyze    (alias: POST /analizar)
POST http://localhost:3000/api/execute
GET  http://localhost:3000/api/health
Content-Type: application/json
```

### 12.2 Solicitud

```json
{
  "codigo": "main { print(\"Hola AutoInfra\"); }"
}
```

### 12.3 Respuesta

```text
{
    ast,
    tokens,
    erroresLexicos,
    erroresSintacticos,
    ejecutado,              // true si el programa se ejecutó
    mensajeEjecucion,       // motivo cuando no se ejecutó (errores sintácticos) o aviso si se ejecutó con errores léxicos
    ejecucion: {            // null si no se ejecutó
        exito, abortada,
        consola,            // print + bitácora, en orden
        salida,             // solo print
        errores             // errores de ejecución / infraestructura
    },
    reportes: {
        tablaTokens,
        errores,            // léxicos, sintácticos, de ejecución, de infraestructura
        ast,                // nodos, aristas, dot, svg
        tablaSimbolos,      // solo al ejecutar
        estadoFinal,        // solo al ejecutar: filas + infraestructura {servers, services, databases}
        bitacora            // solo al ejecutar
    }
}
```

### 12.4 Errores HTTP

- **200:** solicitud procesada, incluso cuando existen errores del programa.
- **400:** el campo `codigo` falta o no es una cadena.
- **500:** error interno real del Backend.

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
- resultado del análisis o de la ejecución;
- estado del proceso (`sin-analizar`, `analizando`, `completado`, `error`);
- acción en curso (`analizar` o `ejecutar`);
- mensaje de error.

También implementa los handlers para:

- cambios en el editor;
- nuevo archivo;
- abrir archivo;
- guardar;
- guardar como;
- analizar y ejecutar (ambos llaman a `procesar(accion)`).

Al editar, crear un archivo o abrir otro archivo se invalidan los resultados anteriores.

### 13.3 `Toolbar.tsx`

Expone los botones:

```text
Nuevo
Abrir
Guardar
Guardar como
Analizar
Ejecutar
```

Durante una solicitud deshabilita estas acciones y muestra `Procesando...` en el botón **Analizar**.

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

Según la acción y la respuesta, el estado `completado` se presenta como `Análisis completado`, `Ejecución exitosa`, `Ejecución con errores` (errores de ejecución o infraestructura), `Ejecución completada con errores léxicos` o `Ejecución no realizada` (errores sintácticos).

El estado de error se presenta en la interfaz bajo el título `Error de comunicación`, incluso cuando el mensaje pueda provenir de una respuesta HTTP del Backend. Este es el comportamiento real actual.

### 13.6 Componentes de resultados

`ResultsPanel.tsx` agrupa, en este orden:

- `AnalysisSummary` (cantidad de tokens, errores léxicos y sintácticos, errores de ejecución cuando se ejecutó, y disponibilidad del AST);
- aviso `mensajeEjecucion`, si existe;
- `ConsolePanel` (salida de `print` y bitácora; solo al ejecutar);
- `InfrastructureView` (tarjetas y tabla del estado final; solo al ejecutar);
- `ErrorsTable`;
- `SymbolsTable` (solo al ejecutar);
- `BitacoraTable` (solo al ejecutar);
- `TokensTable`;
- `AstViewer`.

`ErrorsTable` (errores léxicos, sintácticos, de ejecución y de infraestructura) muestra:

```text
No. | Tipo | Código | Descripción | Línea | Columna
```

Cuando `codigo` es `null`, el Frontend muestra `—`.

`TokensTable` muestra:

```text
No. | Lexema | Token | Línea | Columna
```

`AstViewer` recibe el SVG desde el Backend y lo muestra mediante un elemento `<img>` con una URL `data:`. El Frontend no reconstruye el AST ni genera Graphviz por su cuenta.

---

## 14. Integración Frontend ↔ Backend

El servicio `Frontend/src/services/analisis.service.ts` expone:

```ts
analizarCodigo(codigo)   // POST {URL_BASE}/api/analyze
ejecutarCodigo(codigo)   // POST {URL_BASE}/api/execute
```

`URL_BASE` es `http://localhost:3000` por defecto y puede cambiarse con la variable `VITE_API_URL` (archivo `.env` del Frontend).

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

El repositorio no declara `engines`. El mínimo efectivo lo imponen las dependencias del Frontend (Vite 8, ESLint 10): Node.js 20.19 o superior, o 22.12 o superior. El proyecto fue verificado con Node 22.22 y npm 10.9.

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

`vite.config.ts` no establece un puerto personalizado; por defecto Vite usa `http://localhost:5173`.

### 16.7 Build del Frontend

```bash
npm run build
```

El script definido es:

```text
tsc -b && vite build
```

### 16.8 Pruebas del intérprete

```bash
cd Backend
npm test
```

Ejecuta dos archivos (55 pruebas):

- `tests/run.ts` (46): variables, operadores, entornos, funciones, recursión, ciclos, arreglos, tasks, recursos, acciones nativas y los programas de `examples/`;
- `tests/errores.ts` (9): errores léxicos y sintácticos en un mismo archivo, endpoints, y el archivo de prueba del auxiliar (`examples/ArchivoPrueba.infra`: 3 errores léxicos, 0 sintácticos y 79/79 puntos automáticos).

### 16.9 Otros scripts Frontend

```bash
npm run lint
npm run preview
```

---

## 17. Archivos y funciones clave

| Archivo | Elemento principal | Responsabilidad |
|---|---|---|
| `Backend/app.ts` | inicialización Express | Middlewares, rutas y servidor HTTP |
| `Backend/routes/analisis.route.ts` | `router.post(...)` | Exponer `/api/analyze` (alias `/analizar`), `/api/execute` y `/api/health` |
| `Backend/controllers/analisis.controller.ts` | `analizar`, `ejecutar` | Validar petición, analizar, ejecutar (si no hay errores sintácticos) y generar reportes |
| `Backend/interpreter/interpreter.ts` | `ejecutarPrograma` | Ejecutar el AST y devolver consola, bitácora, errores, símbolos y recursos |
| `Backend/interpreter/nodes.ts` | `Expresion.evaluate`, `Instruccion.execute`, `construirPrograma` | Patrón Interpreter y construcción de nodos ejecutables |
| `Backend/interpreter/environment.ts` | `Entorno` | Entornos y búsqueda de identificadores |
| `Backend/interpreter/natives.ts` | `NATIVAS` | Funciones nativas de infraestructura |
| `Backend/interpreter/infrastructure.ts` | `Recurso` | Servidor, servicio o base de datos simulados |
| `Backend/analizador/analizador.jison` | gramática Jison | Reglas léxicas, sintácticas y acciones de construcción del AST |
| `Backend/analizador/analizador.js` | parser generado | Artefacto CommonJS generado por Jison |
| `Backend/analizador/lexer.ts` | `analizarLexicamente` | Utilidad para ejecutar únicamente el lexer |
| `Backend/analizador/parser.ts` | `analizarCodigo` | Wrapper del parser, contexto y manejo de errores sintácticos |
| `Backend/models/ast.ts` | interfaces AST | Contrato estructural del AST |
| `Backend/reports/tokens.report.ts` | `generarReporteTokens` | Tabla de tokens |
| `Backend/reports/errores.report.ts` | `generarReporteErrores` | Reporte combinado de errores |
| `Backend/reports/ejecucion.report.ts` | `generarReporteSimbolos`, `generarReporteEstadoFinal`, `generarReporteBitacora` | Reportes de la ejecución |
| `Backend/reports/ast.report.ts` | `generarReporteAST` | Nodos, aristas y DOT |
| `Backend/reports/ast.svg.ts` | generación SVG | Convertir DOT a SVG con Viz.js |
| `Backend/reports/reportes.service.ts` | `generarReportes` | Coordinar todos los reportes |
| `Frontend/src/App.tsx` | `App` | Estado general y acciones del usuario |
| `Frontend/src/components/Toolbar.tsx` | `Toolbar` | Operaciones Nuevo/Abrir/Guardar/Analizar/Ejecutar |
| `Frontend/src/components/CodeEditor.tsx` | `CodeEditor` | Editor `<textarea>` |
| `Frontend/src/components/AnalysisStatus.tsx` | `AnalysisStatus` | Estado visual del análisis |
| `Frontend/src/components/results/ResultsPanel.tsx` | `ResultsPanel` | Agrupar resultados |
| `Frontend/src/components/results/ErrorsTable.tsx` | `ErrorsTable` | Mostrar errores |
| `Frontend/src/components/results/TokensTable.tsx` | `TokensTable` | Mostrar tokens |
| `Frontend/src/components/results/AstViewer.tsx` | `AstViewer` | Mostrar SVG del AST |
| `Frontend/src/components/results/ConsolePanel.tsx` | `ConsolePanel` | Salida de `print` y bitácora |
| `Frontend/src/components/results/InfrastructureView.tsx` | `InfrastructureView` | Estado final de recursos |
| `Frontend/src/components/results/SymbolsTable.tsx` | `SymbolsTable` | Tabla de símbolos |
| `Frontend/src/components/results/BitacoraTable.tsx` | `BitacoraTable` | Bitácora de ejecución |
| `Frontend/src/services/analisis.service.ts` | `analizarCodigo`, `ejecutarCodigo` | Comunicación HTTP con el Backend |
| `Frontend/src/services/archivo.service.ts` | funciones de archivo | Abrir y descargar `.infra` |
| `Frontend/src/types/analisis.types.ts` | interfaces Frontend | Contrato tipado de solicitud, respuesta y reportes |

---

## 18. Alcance y limitaciones técnicas

Implementado: análisis léxico y sintáctico con recuperación, AST, intérprete (patrón Interpreter), entornos, funciones (incluida la recursión), ciclos, arreglos, tareas, recursos `server`/`service`/`database`, acciones nativas, dependencias (`INFRA-004`), reportes (tokens, errores, AST, tabla de símbolos, estado final y bitácora) e interfaz web.

Limitaciones conocidas (ver 10.1): sin análisis semántico, sin límite de instrucciones ni de profundidad de recursión, y sin las validaciones de dominio excluidas por el auxiliar. `break`/`continue` fuera de un ciclo terminan silenciosamente el bloque que los contiene (`main`, función o task), sin error. No hay persistencia en el Backend. El programa no se ejecuta si contiene errores sintácticos; los errores léxicos se reportan y la ejecución continúa.

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
7. mantener sincronizado `docs/gramatica.txt` (BNF) con la sintaxis real.

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
intérprete (si cambia la semántica de ejecución: interpreter/*)
        ↓
POST /api/analyze · /api/execute
        ↓
reportes
        ↓
Frontend
        ↓
npm test
```

Para cambios exclusivamente visuales o de manejo de archivos en el Frontend no es necesario regenerar el parser.

---

## 21. Conclusión técnica

AutoInfra combina un analizador Jison con recuperación de errores, un AST propio, un intérprete basado en nodos ejecutables y entornos, y una interfaz web que consume la API REST. El límite del alcance es explícito: no hay análisis semántico (indicación del auxiliar); los errores posteriores al análisis son únicamente de ejecución e infraestructura.


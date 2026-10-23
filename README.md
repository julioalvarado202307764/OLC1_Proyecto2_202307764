# AutoInfra

AutoInfra es un lenguaje interpretado para automatización y simulación de infraestructura (OLC1 — Proyecto 2). Esta aplicación web permite editar archivos `.infra`, **analizarlos** (léxico y sintáctico, con recuperación de errores y AST) y **ejecutarlos** mediante un intérprete basado en el patrón Interpreter sobre un entorno de infraestructura completamente simulado en memoria.

Está dividida en un **Backend** (analizador Jison, intérprete, reportes y API REST) y un **Frontend** (editor, ejecución y visualización de resultados).

## Alcance

Implementado:

- análisis léxico y sintáctico, con recuperación de errores;
- construcción de AST y visualización gráfica (Graphviz/Viz.js);
- intérprete: variables, valores por defecto, entornos (global, función, bloque), expresiones aritméticas, relacionales y lógicas (con corto circuito), `if / else if / else`, `while`, `for`, `break`, `continue`, arreglos, funciones (parámetros tipados, `return`, recursión), `task` / `run`;
- recursos `server`, `service` y `database` con propiedades y `dependsOn`;
- acciones nativas: `start`, `stop`, `restart`, `install`, `uninstall`, `deploy`, `scale`, `connect`, `disconnect`, `print`, `length`, `status`;
- reportes: tokens, errores (léxicos, sintácticos, de ejecución e `INFRA-004`), AST, tabla de símbolos, estado final de infraestructura y bitácora;
- interfaz web para crear, abrir, guardar, analizar y ejecutar archivos `.infra`.

Por indicación del auxiliar **no se implementa análisis semántico** ni lo resaltado en amarillo del enunciado (límites de instrucciones y de recursión, validaciones de dominio, etc.). Detalles en `docs/manual-tecnico.md`, sección 10.1.

## Tecnologías

- **Backend:** Node.js, TypeScript, Express, Jison, Viz.js (`@viz-js/viz`).
- **Frontend:** React, TypeScript, Vite.

## Estructura

```text
.
├── Backend/
│   ├── analizador/    # Jison (gramática, lexer, parser) y wrapper de errores
│   ├── models/        # Interfaces del AST
│   ├── interpreter/   # Intérprete: nodos, entornos, valores, recursos, nativas
│   ├── reports/       # Tokens, errores, AST, símbolos, estado final, bitácora
│   ├── controllers/   # API REST
│   └── tests/         # Pruebas del intérprete (npm test)
├── Frontend/          # Interfaz web React
├── examples/          # Programas .infra de ejemplo
└── docs/              # Gramática (BNF, .txt) y manuales
```

`Backend/analizador/analizador.jison` es la fuente de la gramática; `analizador.js` es generado por Jison (`npm run parse`) y permanece versionado.

## Requisitos

- **Node.js 20.19 o superior (o 22.12 o superior)** y **npm**. Es el mínimo que exigen las dependencias del Frontend (Vite 8); el proyecto fue verificado con Node 22.22 y npm 10.9.
- Un navegador web moderno.
- Dos terminales (una para el Backend y otra para el Frontend).

No se necesita ninguna base de datos ni servicio externo: la infraestructura es una simulación en memoria.

## Instalación y ejecución desde cero

Backend y Frontend son aplicaciones independientes con sus propios `package.json` y `package-lock.json`. Los comandos se ejecutan desde la raíz del repositorio (`OLC1_Proyecto2_<carnet>/`).

```bash
# Terminal 1 — Backend (http://localhost:3000)
cd Backend
npm install
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd Frontend
npm install
npm run dev
```

1. Con el Backend encendido, `http://localhost:3000/api/health` responde `{"status":"ok"}`.
2. Abra en el navegador la dirección que muestre Vite (normalmente `http://localhost:5173`).
3. Presione **Abrir** y seleccione un programa de `examples/`, o escriba código en el editor, y use **Analizar** o **Ejecutar**.

Notas:

- El puerto del Backend se define en `Backend/.env` (`PORT=3000`).
- Si el Backend usa otra dirección, cree `Frontend/.env` con `VITE_API_URL=http://localhost:<puerto>` y reinicie el Frontend.
- `Backend/analizador/analizador.js` está versionado: **no** hace falta ejecutar `npm run parse` salvo que se modifique `analizador.jison`.
- Para instalar exactamente las versiones bloqueadas puede usarse `npm ci` en lugar de `npm install`.

### API

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/api/analyze` (alias `/analizar`) | Análisis sin ejecución. |
| `POST` | `/api/execute` | Análisis y ejecución. |
| `GET` | `/api/health` | Disponibilidad del Backend. |

Cuerpo: `{ "codigo": "<código AutoInfra>" }`.

## Uso básico

1. Cree, abra o escriba un archivo `.infra`.
2. **Analizar:** análisis léxico/sintáctico y AST. **Ejecutar:** además ejecuta el programa. Los errores léxicos se reportan pero no impiden ejecutar (el carácter inválido se descarta); los errores sintácticos sí.
3. Consulte la consola, el estado final de infraestructura, los errores, la tabla de símbolos, la bitácora, los tokens y el AST.

Hay programas de prueba en `examples/` (`basico`, `intermedio`, `avanzado`, `integral`, `programa_completo`, `error_dependencia`, `errores_mixtos` y `ArchivoPrueba`); su descripción está en el manual de usuario, sección 17.

## Comandos

```bash
# Backend (carpeta Backend/)
npm run dev     # servidor con recarga
npm run parse   # regenera analizador.js desde analizador.jison
npm test        # 55 pruebas: intérprete, errores léxicos/sintácticos y archivo del auxiliar

# Frontend (carpeta Frontend/)
npm run dev     # servidor de desarrollo
npm run build   # compilación de producción (tsc -b && vite build)
npm run lint    # ESLint
```

## Documentación

- [Gramática de AutoInfra (BNF)](docs/gramatica.txt)
- [Manual técnico](docs/manual-tecnico.md)
- [Manual de usuario](docs/manual-usuario.md)

# AutoInfra

AutoInfra es una aplicación web para editar y analizar archivos con extensión `.infra`. En su alcance actual, el proyecto realiza análisis léxico y sintáctico, construye un AST, recupera errores cuando es posible y genera reportes de tokens, errores y AST gráfico.

La aplicación está dividida en un **Backend** encargado del análisis y un **Frontend** encargado de la edición de archivos, envío del código y visualización de resultados.

## Alcance actual

AutoInfra implementa:

- análisis léxico;
- recuperación de errores léxicos;
- análisis sintáctico;
- recuperación de errores sintácticos;
- construcción de AST;
- reporte de tokens;
- reporte de errores léxicos y sintácticos;
- generación y visualización gráfica del AST;
- interfaz web para crear, abrir, guardar y analizar archivos `.infra`;
- comunicación Frontend ↔ Backend mediante HTTP/JSON.

## Tecnologías principales

### Backend

- Node.js
- TypeScript
- Express
- Jison
- Viz.js (`@viz-js/viz`) para generar el SVG del AST

### Frontend

- React
- TypeScript
- Vite

## Estructura general

```text
.
├── Backend/    # API, analizador Jison, AST y reportes
├── Frontend/   # Interfaz web React
└── docs/       # Gramática y manuales
```

`Backend/analizador/analizador.jison` es la fuente de la gramática. El archivo `Backend/analizador/analizador.js` es generado por Jison, permanece versionado y puede regenerarse mediante el script correspondiente.

## Instalación rápida

Backend y Frontend son aplicaciones independientes y poseen sus propios archivos `package.json`. Sus dependencias deben instalarse por separado.

### Backend

```bash
cd Backend
npm install
npm run dev
```

Con la configuración actual, el Backend utiliza el puerto `3000` y expone el endpoint:

```text
POST http://localhost:3000/analizar
```

### Frontend

En otra terminal:

```bash
cd Frontend
npm install
npm run dev
```

Vite mostrará en la terminal la dirección local del Frontend. Abra esa dirección en el navegador y mantenga también el Backend en ejecución.

## Uso básico

Desde la interfaz web se puede:

1. crear un archivo nuevo;
2. abrir un archivo `.infra`;
3. editar su contenido;
4. guardar o guardar como mediante descarga desde el navegador;
5. presionar **Analizar** para enviar el código al Backend;
6. consultar el resumen, los errores léxicos/sintácticos, la tabla de tokens y el AST gráfico.

Los resultados corresponden al análisis actual del contenido visible en el editor.

## Comandos relevantes

### Backend

```bash
npm install
npm run dev
npm run parse
```

`npm run parse` regenera:

```text
Backend/analizador/analizador.js
```

a partir de:

```text
Backend/analizador/analizador.jison
```

Debe utilizarse cuando se modifica la gramática fuente.

### Frontend

```bash
npm install
npm run dev
npm run build
```

`npm run build` genera el build de producción del Frontend mediante TypeScript y Vite.

## Documentación

- [Gramática de AutoInfra](docs/gramatica.md)
- [Manual técnico](docs/manual-tecnico.md)
- [Manual de usuario](docs/manual-usuario.md)

## Alcance excluido

Esta versión del proyecto **no implementa**:

- análisis semántico;
- Interpreter o motor de ejecución;
- tabla de símbolos;
- ejecución o simulación de infraestructura;
- estado final de infraestructura;
- bitácora.

Por ello, la acción principal de la aplicación es **Analizar** código `.infra`; reconocer sintácticamente una instrucción no implica ejecutarla ni simular sus efectos.

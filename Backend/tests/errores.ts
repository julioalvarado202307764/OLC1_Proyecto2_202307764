import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import type { Request, Response } from "express";

import { analizarCodigo } from "../analizador/parser";
import { analizar, ejecutar } from "../controllers/analisis.controller";
import { generarReporteErrores } from "../reports/errores.report";

/* =========================================================
   Regresión: errores léxicos y sintácticos en un mismo archivo.

   - El análisis SIEMPRE termina y reporta todos los errores.
   - Solo los errores sintácticos impiden ejecutar; los léxicos no.
   Uso: ts-node tests/errores.ts   (incluido en npm test)
   ========================================================= */

let total = 0;
const fallos: string[] = [];

async function prueba(nombre: string, fn: () => void | Promise<void>): Promise<void> {
    total++;
    try {
        await fn();
        console.log(`  ok   ${nombre}`);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        fallos.push(`${nombre}: ${msg}`);
        console.log(`  FAIL ${nombre}\n       ${msg.split("\n").join("\n       ")}`);
    }
}

/** Invoca un handler de Express sin levantar el servidor. */
async function llamar(
    handler: (req: Request<{}, {}, { codigo?: unknown }>, res: Response) => Promise<Response>,
    codigo: string
): Promise<{ status: number; cuerpo: any }> {
    let status = 200;
    let cuerpo: any = null;

    const res = {
        status(c: number) { status = c; return res; },
        json(o: unknown) { cuerpo = o; return res; }
    } as unknown as Response;

    await handler({ body: { codigo } } as Request<{}, {}, { codigo?: unknown }>, res);
    return { status, cuerpo };
}

/*
 * Archivo con 3 errores léxicos (@ # $) y 4 sintácticos reales
 * (resultados idénticos a los del parser original, verificados).
 */
const MIXTO = [
    'server backend { cpu = 4; memory = 8; disk = 100; os = "ubuntu"; }',
    "service api { port = 8080; replicas = 2; }",
    "",
    "main {",
    "    int a = 1; @",
    "    int b = 2; #",
    "    int c = 3; $",
    "    int d = ;",
    "    print(1);",
    "    print(a)",
    "    int e = 5;",
    "    print(2);",
    "    print(3);",
    "    print(4);",
    "    int = 7;",
    "    print(5);",
    "    print(6);",
    "    print(7);",
    "    10 / 0;",
    "    print(c);",
    "}",
    ""
].join("\n");

(async () => {
    console.log("Errores léxicos y sintácticos en un mismo archivo");

    await prueba("el análisis detecta 3 léxicos y 4 sintácticos, con línea y columna", () => {
        const r = analizarCodigo(MIXTO);

        assert.deepStrictEqual(
            r.erroresLexicos.map((e) => [e.lexema, e.linea, e.columna]),
            [["@", 5, 16], ["#", 6, 16], ["$", 7, 16]]
        );

        assert.deepStrictEqual(
            r.erroresSintacticos.map((e) => [e.linea, e.columna]),
            [[8, 13], [11, 5], [15, 9], [19, 5]]
        );

        for (const e of r.erroresSintacticos) {
            assert.strictEqual(e.tipo, "Sintáctico");
            assert.ok(e.descripcion.length > 0);
        }
    });

    await prueba("los léxicos no suprimen a los sintácticos (ni al revés)", () => {
        const soloLexicos = analizarCodigo(MIXTO.replace("int d = ;", "int d = 0;").replace("print(a)\n", "print(a);\n").replace("int = 7;", "int g = 7;").replace("10 / 0;", "print(0);"));
        assert.strictEqual(soloLexicos.erroresLexicos.length, 3);
        assert.strictEqual(soloLexicos.erroresSintacticos.length, 0);
        assert.ok(soloLexicos.ast);

        const r = analizarCodigo(MIXTO);
        assert.strictEqual(r.erroresLexicos.length + r.erroresSintacticos.length, 7);
    });

    await prueba("el reporte de errores contiene ambos tipos", () => {
        const filas = generarReporteErrores(analizarCodigo(MIXTO)).filas;
        assert.strictEqual(filas.filter((f) => f.tipo === "Léxico").length, 3);
        assert.strictEqual(filas.filter((f) => f.tipo === "Sintáctico").length, 4);
        assert.deepStrictEqual(filas.map((f) => f.numero), [1, 2, 3, 4, 5, 6, 7]);
    });

    await prueba("API /analyze devuelve ambos tipos de error", async () => {
        const { status, cuerpo } = await llamar(analizar, MIXTO);
        assert.strictEqual(status, 200);
        assert.strictEqual(cuerpo.erroresLexicos.length, 3);
        assert.strictEqual(cuerpo.erroresSintacticos.length, 4);
        assert.strictEqual(cuerpo.reportes.errores.filas.length, 7);
        assert.strictEqual(cuerpo.ejecutado, false);
    });

    await prueba("API /execute con errores sintácticos: no ejecuta pero conserva TODOS los errores", async () => {
        const { status, cuerpo } = await llamar(ejecutar, MIXTO);
        assert.strictEqual(status, 200);
        assert.strictEqual(cuerpo.ejecutado, false);
        assert.strictEqual(cuerpo.ejecucion, null);
        assert.match(cuerpo.mensajeEjecucion, /errores sintácticos/);
        assert.strictEqual(cuerpo.erroresLexicos.length, 3);
        assert.strictEqual(cuerpo.erroresSintacticos.length, 4);
        assert.strictEqual(cuerpo.reportes.errores.filas.length, 7);
    });

    await prueba("API /execute con SOLO errores léxicos: ejecuta y reporta los léxicos", async () => {
        const { cuerpo } = await llamar(
            ejecutar,
            'main {\n    print("a"); @\n    print("b");\n}'
        );
        assert.strictEqual(cuerpo.ejecutado, true);
        assert.deepStrictEqual(cuerpo.ejecucion.salida, ["a", "b"]);
        assert.strictEqual(cuerpo.erroresLexicos.length, 1);
        assert.strictEqual(cuerpo.reportes.errores.filas.length, 1);
        assert.strictEqual(cuerpo.reportes.errores.filas[0].tipo, "Léxico");
    });

    console.log("\nDeclaraciones con valor por defecto (int x;) son válidas");

    await prueba("`tipo id;` no es error sintáctico (valores por defecto, sección 5.1)", () => {
        const r = analizarCodigo(
            "int g; float f; string s; bool b;\nmain { int a; float c; string d; bool e; print(a, c, \"[\" + d + \"]\", e); }"
        );
        assert.strictEqual(r.erroresSintacticos.length, 0);
        assert.strictEqual(r.erroresLexicos.length, 0);
    });

    console.log("\nArchivo de prueba del auxiliar (examples/ArchivoPrueba.infra)");

    const archivo = fs.readFileSync(
        path.join(__dirname, "..", "..", "examples", "ArchivoPrueba.infra"), "utf8"
    );

    await prueba("detecta exactamente 3 léxicos (@) y 0 sintácticos", () => {
        const r = analizarCodigo(archivo);
        assert.deepStrictEqual(
            r.erroresLexicos.map((e) => [e.lexema, e.linea, e.columna]),
            [["@", 251, 1], ["@", 513, 1], ["@", 983, 1]]
        );
        assert.strictEqual(r.erroresSintacticos.length, 0);
        assert.ok(r.ast);
    });

    await prueba("se ejecuta tras los errores léxicos y obtiene 79/79 y 78/78", async () => {
        const { cuerpo } = await llamar(ejecutar, archivo);
        assert.strictEqual(cuerpo.ejecutado, true);
        assert.strictEqual(cuerpo.ejecucion.exito, true);
        assert.strictEqual(cuerpo.erroresLexicos.length, 3);
        assert.strictEqual(cuerpo.reportes.errores.filas.length, 3);
        const salida: string[] = cuerpo.ejecucion.salida;
        assert.ok(salida.includes("PUNTAJE AUTOMATICO: 79.0/79"));
        assert.ok(salida.includes("Comprobaciones aprobadas: 78/78"));
        assert.ok(salida.includes("Continuidad tras los 3 caracteres aislados: true"));
        assert.ok(!salida.some((l) => l.includes("cumple=false")));
    });

    console.log(`\n${total - fallos.length}/${total} pruebas correctas`);

    if (fallos.length > 0) {
        console.log("\nFallos:\n - " + fallos.join("\n - "));
        process.exit(1);
    }
})();

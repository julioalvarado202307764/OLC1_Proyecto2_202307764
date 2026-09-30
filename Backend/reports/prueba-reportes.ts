import {
    analizarCodigo
} from "../analizador/parser";

import {
    generarReportes
} from "./reportes.service";


async function main(): Promise<void> {

    /* =====================================================
       EJECUCIÓN 1 — CON ERRORES
       ===================================================== */

    const codigo1 = `main {
        int alpha = ;
        @
        print("primero");
    }`;

    const resultado1 =
        analizarCodigo(codigo1);

    const reportes1 =
        await generarReportes(resultado1);


    console.log("=== EJECUCIÓN 1 ===");

    console.log(
        "Tokens:",
        reportes1.tablaTokens.filas.length
    );

    console.log(
        "Errores:",
        reportes1.errores.filas.length
    );

    console.log(
        "Nodos AST:",
        reportes1.ast.nodos.length
    );

    console.log(
        "SVG disponible:",
        reportes1.ast.svg !== null
    );


    /* =====================================================
       EJECUCIÓN 2 — CÓDIGO VÁLIDO
       ===================================================== */

    const codigo2 = `main {
        int beta = 2;
        print(beta);
    }`;

    const resultado2 =
        analizarCodigo(codigo2);

    const reportes2 =
        await generarReportes(resultado2);


    console.log("\n=== EJECUCIÓN 2 ===");

    console.log(
        "Tokens:",
        reportes2.tablaTokens.filas.length
    );

    console.log(
        "Errores:",
        reportes2.errores.filas.length
    );

    console.log(
        "Nodos AST:",
        reportes2.ast.nodos.length
    );

    console.log(
        "SVG disponible:",
        reportes2.ast.svg !== null
    );


    /* =====================================================
       VERIFICACIÓN DE AISLAMIENTO
       ===================================================== */

    const contieneBeta =
        reportes2.tablaTokens.filas.some(
            (fila) => fila.lexema === "beta"
        );

    const contieneAlpha =
        reportes2.tablaTokens.filas.some(
            (fila) => fila.lexema === "alpha"
        );

    const contienePrimero =
        reportes2.tablaTokens.filas.some(
            (fila) => fila.lexema.includes("primero")
        );


    console.log("\n=== AISLAMIENTO ===");

    console.log(
        "Segundo reporte contiene beta:",
        contieneBeta
    );

    console.log(
        "Segundo reporte contiene alpha:",
        contieneAlpha
    );

    console.log(
        "Segundo reporte contiene primero:",
        contienePrimero
    );

    console.log(
        "Segundo reporte tiene errores:",
        reportes2.errores.filas.length > 0
    );
}


main().catch((error) => {
    console.error(
        "Error durante la prueba de reportes:",
        error
    );

    process.exitCode = 1;
});
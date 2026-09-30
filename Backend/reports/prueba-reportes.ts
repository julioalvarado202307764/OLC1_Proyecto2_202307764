import { analizarCodigo } from "../analizador/parser";

import {
    generarReporteAST
} from "./ast.report";

import {
    renderizarReporteAST
} from "./ast.svg";


async function main(): Promise<void> {

    /* =====================================================
       PRUEBA 1 — AST VÁLIDO
       ===================================================== */

    const codigoValido = `main {
        int x = 2 + 3 * 4;
        print(x);
    }`;

    const resultadoValido =
        analizarCodigo(codigoValido);

    const reporteValido =
        generarReporteAST(resultadoValido);

    const reporteValidoSVG =
        await renderizarReporteAST(reporteValido);


    console.log("=== AST VÁLIDO ===");

    console.log(
        "Nodos:",
        reporteValidoSVG.nodos.length
    );

    console.log(
        "Aristas:",
        reporteValidoSVG.aristas.length
    );

    console.log(
        "DOT disponible:",
        reporteValidoSVG.dot !== null
    );

    console.log(
        "SVG disponible:",
        reporteValidoSVG.svg !== null
    );

    console.log(
        "Contiene <svg:",
        reporteValidoSVG.svg?.includes("<svg") ?? false
    );

    console.log(
        "Contiene </svg>:",
        reporteValidoSVG.svg?.includes("</svg>") ?? false
    );


    /* =====================================================
       PRUEBA 2 — AST PARCIAL RECUPERADO
       ===================================================== */

    const codigoParcial = `main {
        int x = ;
        print("continua");
    }`;

    const resultadoParcial =
        analizarCodigo(codigoParcial);

    const reporteParcial =
        generarReporteAST(resultadoParcial);

    const reporteParcialSVG =
        await renderizarReporteAST(reporteParcial);


    console.log("\n=== AST PARCIAL ===");

    console.log(
        "Errores sintácticos:",
        resultadoParcial.erroresSintacticos.length
    );

    console.log(
        "AST disponible:",
        resultadoParcial.ast !== null
    );

    console.log(
        "Nodos:",
        reporteParcialSVG.nodos.length
    );

    console.log(
        "DOT disponible:",
        reporteParcialSVG.dot !== null
    );

    console.log(
        "SVG disponible:",
        reporteParcialSVG.svg !== null
    );

    console.log(
        "Contiene <svg:",
        reporteParcialSVG.svg?.includes("<svg") ?? false
    );


    /* =====================================================
       PRUEBA 3 — AST NULL
       ===================================================== */

    const reporteSinAST =
        generarReporteAST({
            ast: null,
            tokens: [],
            erroresLexicos: [],
            erroresSintacticos: []
        });

    const reporteSinASTSVG =
        await renderizarReporteAST(reporteSinAST);


    console.log("\n=== AST NULL ===");

    console.log(
        JSON.stringify(
            reporteSinASTSVG,
            null,
            2
        )
    );
}


main().catch((error) => {
    console.error(
        "Error durante la prueba del SVG:",
        error
    );

    process.exitCode = 1;
});
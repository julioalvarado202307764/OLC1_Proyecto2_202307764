import type {
    ResultadoAnalisis
} from "../analizador/parser";

import type {
    ResultadoEjecucion
} from "../interpreter/interpreter";

import type {
    ResultadoReportes
} from "./reportes.types";

import {
    generarReporteTokens
} from "./tokens.report";

import {
    generarReporteErrores
} from "./errores.report";

import {
    generarReporteAST
} from "./ast.report";

import {
    renderizarReporteAST
} from "./ast.svg";

import {
    generarReporteBitacora,
    generarReporteEstadoFinal,
    generarReporteSimbolos
} from "./ejecucion.report";


export async function generarReportes(
    resultado: ResultadoAnalisis,
    ejecucion: ResultadoEjecucion | null = null
): Promise<ResultadoReportes> {

    const tablaTokens =
        generarReporteTokens(resultado);

    const errores =
        generarReporteErrores(
            resultado,
            ejecucion?.errores ?? []
        );

    const reporteAST =
        generarReporteAST(resultado);

    const ast =
        await renderizarReporteAST(reporteAST);

    const reportes: ResultadoReportes = {
        tablaTokens,
        errores,
        ast
    };

    if (ejecucion !== null) {
        reportes.tablaSimbolos = generarReporteSimbolos(ejecucion);
        reportes.estadoFinal = generarReporteEstadoFinal(ejecucion);
        reportes.bitacora = generarReporteBitacora(ejecucion);
    }

    return reportes;
}

import type {
    ResultadoAnalisis
} from "../analizador/parser";

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


export async function generarReportes(
    resultado: ResultadoAnalisis
): Promise<ResultadoReportes> {

    const tablaTokens =
        generarReporteTokens(resultado);

    const errores =
        generarReporteErrores(resultado);

    const reporteAST =
        generarReporteAST(resultado);

    const ast =
        await renderizarReporteAST(reporteAST);


    return {
        tablaTokens,
        errores,
        ast
    };
}
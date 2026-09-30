import type { ResultadoAnalisis } from "../analizador/parser";
import { generarReporteAST } from "./ast.report";


const resultadoSinAST: ResultadoAnalisis = {
    ast: null,
    tokens: [],
    erroresLexicos: [],
    erroresSintacticos: []
};

const reporte = generarReporteAST(resultadoSinAST);

console.log(
    JSON.stringify(reporte, null, 2)
);
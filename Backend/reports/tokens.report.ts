import type {
    ResultadoAnalisis
} from "../analizador/parser";

import type {
    ReporteTokens
} from "./reportes.types";


export function generarReporteTokens(
    resultado: ResultadoAnalisis
): ReporteTokens {
    return {
        filas: resultado.tokens.map(
            (token, indice) => ({
                numero: indice + 1,
                lexema: token.lexema,
                token: token.tipo,
                linea: token.linea,
                columna: token.columna
            })
        )
    };
}
import type {
    ResultadoAnalisis
} from "../analizador/parser";

import type {
    ReporteErrores
} from "./reportes.types";


export function generarReporteErrores(
    resultado: ResultadoAnalisis
): ReporteErrores {
    const errores = [
        ...resultado.erroresLexicos.map((error) => ({
            tipo: error.tipo,
            codigo: null as null,
            descripcion: error.descripcion,
            linea: error.linea,
            columna: error.columna
        })),

        ...resultado.erroresSintacticos.map((error) => ({
            tipo: error.tipo,
            codigo: null as null,
            descripcion: error.descripcion,
            linea: error.linea,
            columna: error.columna
        }))
    ];

    errores.sort((a, b) => {
        if (a.linea !== b.linea) {
            return a.linea - b.linea;
        }

        return a.columna - b.columna;
    });

    return {
        filas: errores.map((error, indice) => ({
            numero: indice + 1,
            ...error
        }))
    };
}
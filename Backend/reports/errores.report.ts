import type {
    ResultadoAnalisis
} from "../analizador/parser";

import type {
    ErrorEjecucionInfo
} from "../interpreter/errors";

import type {
    ReporteErrores
} from "./reportes.types";


type FilaError = Omit<ReporteErrores["filas"][number], "numero">;


export function generarReporteErrores(
    resultado: ResultadoAnalisis,
    erroresEjecucion: ErrorEjecucionInfo[] = []
): ReporteErrores {
    const errores: FilaError[] = [
            ...resultado.erroresLexicos.map((error) => ({
                tipo: error.tipo,
                codigo: null,
                descripcion: error.descripcion,
                linea: error.linea,
                columna: error.columna
            })),

            ...resultado.erroresSintacticos.map((error) => ({
                tipo: error.tipo,
                codigo: null,
                descripcion: error.descripcion,
                linea: error.linea,
                columna: error.columna
            })),

            ...erroresEjecucion.map((error) => ({
                tipo: error.tipo,
                codigo: error.codigo,
                descripcion: error.descripcion,
                linea: error.linea,
                columna: error.columna
            }))
        ];

    /*
     * Léxicos y sintácticos se ordenan por posición; los errores de
     * ejecución ocurren después del análisis y conservan su orden.
     */
    const analisis = errores.length - erroresEjecucion.length;

    const delAnalisis = errores.slice(0, analisis).sort((a, b) => {
        if (a.linea !== b.linea) {
            return a.linea - b.linea;
        }

        return a.columna - b.columna;
    });

    const todos = [...delAnalisis, ...errores.slice(analisis)];

    return {
        filas: todos.map((error, indice) => ({
            numero: indice + 1,
            ...error
        }))
    };
}

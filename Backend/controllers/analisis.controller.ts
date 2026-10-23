import { Request, Response } from "express";

import {
    analizarCodigo
} from "../analizador/parser";

import type {
    ResultadoAnalisis
} from "../analizador/parser";

import {
    ejecutarPrograma
} from "../interpreter/interpreter";

import type {
    ResultadoEjecucion
} from "../interpreter/interpreter";

import type {
    ErrorEjecucionInfo
} from "../interpreter/errors";

import {
    generarReportes
} from "../reports/reportes.service";

import type {
    ResultadoReportes
} from "../reports/reportes.types";


interface SolicitudAnalisis {
    /* Campo principal. */
    codigo?: unknown;

    /* Alias utilizado por los ejemplos del enunciado. */
    source?: unknown;
}


/**
 * Resumen serializable de la ejecución. Las tablas completas
 * (símbolos, estado final, bitácora) viajan dentro de `reportes`.
 */
interface EjecucionAPI {
    exito: boolean;
    abortada: boolean;
    consola: string[];
    salida: string[];
    errores: ErrorEjecucionInfo[];
}


interface RespuestaAnalisisAPI
    extends ResultadoAnalisis {
    reportes: ResultadoReportes;
    ejecutado: boolean;
    ejecucion: EjecucionAPI | null;
    mensajeEjecucion: string | null;
}


function resumirEjecucion(e: ResultadoEjecucion): EjecucionAPI {
    return {
        exito: e.exito,
        abortada: e.abortada,
        consola: e.consola,
        salida: e.salida,
        errores: e.errores
    };
}


async function procesar(
    req: Request<{}, {}, SolicitudAnalisis>,
    res: Response,
    ejecutar: boolean
): Promise<Response> {

    const codigo = req.body?.codigo ?? req.body?.source;


    /*
     * Validación exclusivamente de la petición HTTP.
     * No pertenece al análisis del lenguaje AutoInfra.
     */
    if (typeof codigo !== "string") {
        return res.status(400).json({
            error:
                "El campo 'codigo' es obligatorio y debe ser una cadena."
        });
    }


    try {
        /*
         * El código se analiza UNA sola vez.
         */
        const resultado: ResultadoAnalisis =
            analizarCodigo(codigo);

        /*
         * Los errores léxicos NO impiden ejecutar: el lexer descarta el
         * carácter inválido, lo registra y el análisis continúa con un AST
         * completo (recuperación léxica). Solo los errores sintácticos
         * dejan un AST incompleto o inexistente y bloquean la ejecución.
         *
         * En ambos casos TODOS los errores se reportan: el análisis
         * siempre termina antes de decidir si se ejecuta.
         */
        const puedeEjecutarse =
            resultado.erroresSintacticos.length === 0 &&
            resultado.ast !== null;

        let ejecucion: ResultadoEjecucion | null = null;
        let mensajeEjecucion: string | null = null;

        if (ejecutar) {
            if (!puedeEjecutarse) {
                mensajeEjecucion =
                    "El programa no se ejecutó porque contiene " +
                    "errores sintácticos.";
            } else {
                ejecucion = ejecutarPrograma(resultado.ast);

                if (resultado.erroresLexicos.length > 0) {
                    mensajeEjecucion =
                        "El programa se ejecutó tras descartar " +
                        `${resultado.erroresLexicos.length} carácter(es) ` +
                        "no reconocido(s) (errores léxicos reportados).";
                }
            }
        }

        /*
         * Todos los reportes se derivan del mismo análisis
         * (y de la misma ejecución, cuando existe).
         */
        const reportes: ResultadoReportes =
            await generarReportes(resultado, ejecucion);


        const respuesta: RespuestaAnalisisAPI = {
            ...resultado,
            reportes,
            ejecutado: ejecucion !== null,
            ejecucion:
                ejecucion === null
                    ? null
                    : resumirEjecucion(ejecucion),
            mensajeEjecucion
        };


        return res
            .status(200)
            .json(respuesta);

    } catch (error) {
        /*
         * Los errores léxicos, sintácticos y de ejecución normales
         * forman parte de la respuesta y NO deben producir HTTP 500.
         *
         * Aquí llegan únicamente fallos internos reales.
         */
        console.error(
            "Error interno al procesar el código:",
            error
        );

        return res.status(500).json({
            error:
                "Ocurrió un error interno durante el análisis."
        });
    }
}


/** Análisis léxico + sintáctico + AST (sin ejecutar). */
export const analizar = (
    req: Request<{}, {}, SolicitudAnalisis>,
    res: Response
): Promise<Response> => procesar(req, res, false);


/** Análisis y ejecución del programa. */
export const ejecutar = (
    req: Request<{}, {}, SolicitudAnalisis>,
    res: Response
): Promise<Response> => procesar(req, res, true);


export const salud = (
    _req: Request,
    res: Response
): Response => res.status(200).json({ status: "ok" });

import { Request, Response } from "express";

import {
    analizarCodigo
} from "../analizador/parser";

import type {
    ResultadoAnalisis
} from "../analizador/parser";

import {
    generarReportes
} from "../reports/reportes.service";

import type {
    ResultadoReportes
} from "../reports/reportes.types";


interface SolicitudAnalisis {
    codigo?: unknown;
}


interface RespuestaAnalisisAPI
    extends ResultadoAnalisis {
    reportes: ResultadoReportes;
}


export const analizar = async (
    req: Request<{}, {}, SolicitudAnalisis>,
    res: Response
): Promise<Response> => {

    const { codigo } = req.body;


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
         * Todos los reportes se derivan del mismo
         * ResultadoAnalisis.
         */
        const reportes: ResultadoReportes =
            await generarReportes(resultado);


        const respuesta: RespuestaAnalisisAPI = {
            ...resultado,
            reportes
        };


        return res
            .status(200)
            .json(respuesta);

    } catch (error) {
        /*
         * Los errores léxicos y sintácticos normales
         * forman parte de ResultadoAnalisis y NO
         * deben producir HTTP 500.
         *
         * Aquí llegan únicamente fallos internos reales.
         */
        console.error(
            "Error interno al analizar el código:",
            error
        );

        return res.status(500).json({
            error:
                "Ocurrió un error interno durante el análisis."
        });
    }
};
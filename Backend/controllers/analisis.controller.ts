import { Request, Response } from "express";
import {
    analizarCodigo,
    ResultadoAnalisis
} from "../analizador/parser";


interface SolicitudAnalisis {
    codigo?: unknown;
}


export const analizar = (
    req: Request<{}, {}, SolicitudAnalisis>,
    res: Response
): Response => {
    const { codigo } = req.body;

    /*
     * Esta validación pertenece a la entrada HTTP,
     * no al lenguaje AutoInfra.
     *
     * Solo verificamos que la API haya recibido
     * una cadena para poder enviarla al analizador.
     */
    if (typeof codigo !== "string") {
        return res.status(400).json({
            error: "El campo 'codigo' es obligatorio y debe ser una cadena."
        });
    }

    try {
        const resultado: ResultadoAnalisis =
            analizarCodigo(codigo);

        return res.status(200).json(resultado);
    } catch (error) {
        /*
         * Los errores léxicos y sintácticos normales NO llegan aquí:
         * analizarCodigo los devuelve dentro de ResultadoAnalisis.
         *
         * Este catch queda exclusivamente para fallos internos reales.
         */
        console.error("Error interno al analizar el código:", error);

        return res.status(500).json({
            error: "Ocurrió un error interno durante el análisis."
        });
    }
};
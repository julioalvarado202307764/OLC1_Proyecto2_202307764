import type {
    RespuestaAnalisis,
    RespuestaErrorAPI,
    SolicitudAnalisis
} from "../types/analisis.types";


const URL_ANALIZAR =
    "http://localhost:3000/analizar";


export async function analizarCodigo(
    codigo: string
): Promise<RespuestaAnalisis> {

    const solicitud: SolicitudAnalisis = {
        codigo
    };


    const respuesta = await fetch(
        URL_ANALIZAR,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(solicitud)
        }
    );


    if (!respuesta.ok) {
        let mensaje =
            `Error HTTP ${respuesta.status}.`;

        try {
            const errorAPI =
                await respuesta.json() as RespuestaErrorAPI;

            if (
                typeof errorAPI.error === "string" &&
                errorAPI.error.length > 0
            ) {
                mensaje = errorAPI.error;
            }

        } catch {
            /*
             * Si el servidor devuelve una respuesta que no
             * contiene JSON válido, conservamos el mensaje
             * HTTP genérico.
             */
        }

        throw new Error(mensaje);
    }


    const datos =
        await respuesta.json();

    return datos as RespuestaAnalisis;
}
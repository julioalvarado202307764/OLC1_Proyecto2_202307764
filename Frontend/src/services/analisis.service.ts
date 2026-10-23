import type {
    RespuestaAnalisis,
    RespuestaErrorAPI,
    SolicitudAnalisis
} from "../types/analisis.types";


/*
 * URL base del Backend. Puede cambiarse con la variable
 * VITE_API_URL (archivo .env del Frontend).
 */
const URL_BASE: string =
    import.meta.env.VITE_API_URL ??
    "http://localhost:3000";


async function enviar(
    ruta: string,
    codigo: string
): Promise<RespuestaAnalisis> {

    const solicitud: SolicitudAnalisis = {
        codigo
    };


    const respuesta = await fetch(
        `${URL_BASE}${ruta}`,
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


/** Análisis léxico, sintáctico y AST (sin ejecutar). */
export function analizarCodigo(
    codigo: string
): Promise<RespuestaAnalisis> {
    return enviar("/api/analyze", codigo);
}


/** Análisis y ejecución del programa. */
export function ejecutarCodigo(
    codigo: string
): Promise<RespuestaAnalisis> {
    return enviar("/api/execute", codigo);
}

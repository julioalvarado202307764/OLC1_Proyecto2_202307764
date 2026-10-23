export type EstadoAnalisis =
    | "sin-analizar"
    | "analizando"
    | "completado"
    | "error";

export type AccionAnalisis =
    | "analizar"
    | "ejecutar";


interface AnalysisStatusProps {
    estado: EstadoAnalisis;
    mensajeError: string | null;
    accion?: AccionAnalisis;
    /* null = no se ejecutó; true/false = ejecución exitosa/fallida. */
    exitoEjecucion?: boolean | null;
    /* Cantidad de errores léxicos reportados (la ejecución continúa tras ellos). */
    erroresLexicos?: number;
}


export function AnalysisStatus({
    estado,
    mensajeError,
    accion = "analizar",
    exitoEjecucion = null,
    erroresLexicos = 0
}: AnalysisStatusProps) {

    let titulo = "Sin analizar";

    let descripcion =
        "Escribe código AutoInfra y presiona Analizar o Ejecutar.";

    let clase = "";


    if (estado === "analizando") {
        titulo =
            accion === "ejecutar"
                ? "Ejecutando"
                : "Analizando";

        descripcion =
            "Esperando respuesta del Backend.";
    }


    if (estado === "completado") {
        if (accion === "ejecutar") {
            if (exitoEjecucion === true && erroresLexicos > 0) {
                titulo = "Ejecución completada con errores léxicos";
                descripcion =
                    "Se descartaron caracteres no reconocidos y el programa continuó. Revisa el panel de errores.";
                clase = "status-fail";
            } else if (exitoEjecucion === true) {
                titulo = "Ejecución exitosa";
                descripcion =
                    "El programa se ejecutó sin errores.";
                clase = "status-ok";
            } else if (exitoEjecucion === false) {
                titulo = "Ejecución con errores";
                descripcion =
                    "La ejecución terminó con errores. Revisa el panel de errores y la bitácora.";
                clase = "status-fail";
            } else {
                titulo = "Ejecución no realizada";
                descripcion =
                    "El programa contiene errores sintácticos y no fue ejecutado.";
                clase = "status-fail";
            }
        } else {
            titulo = "Análisis completado";

            descripcion =
                "El Backend respondió correctamente.";
        }
    }


    if (estado === "error") {
        titulo = "Error de comunicación";

        descripcion =
            mensajeError ??
            "No fue posible comunicarse con el Backend.";

        clase = "status-fail";
    }


    return (
        <section className={`status-panel ${clase}`}>
            <div>
                <strong>Estado:</strong>

                <span className="status-value">
                    {titulo}
                </span>
            </div>

            <p>
                {descripcion}
            </p>
        </section>
    );
}

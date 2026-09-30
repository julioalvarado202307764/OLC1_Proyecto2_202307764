export type EstadoAnalisis =
    | "sin-analizar"
    | "analizando"
    | "completado"
    | "error";


interface AnalysisStatusProps {
    estado: EstadoAnalisis;
    mensajeError: string | null;
}


export function AnalysisStatus({
    estado,
    mensajeError
}: AnalysisStatusProps) {

    let titulo = "Sin analizar";

    let descripcion =
        "Escribe código AutoInfra y presiona Analizar.";


    if (estado === "analizando") {
        titulo = "Analizando";

        descripcion =
            "Esperando respuesta del Backend.";
    }


    if (estado === "completado") {
        titulo = "Análisis completado";

        descripcion =
            "El Backend respondió correctamente.";
    }


    if (estado === "error") {
        titulo = "Error de comunicación";

        descripcion =
            mensajeError ??
            "No fue posible comunicarse con el Backend.";
    }


    return (
        <section className="status-panel">
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
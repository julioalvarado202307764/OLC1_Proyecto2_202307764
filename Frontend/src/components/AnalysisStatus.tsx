export function AnalysisStatus() {
    return (
        <section className="status-panel">
            <div>
                <strong>Estado:</strong>
                <span className="status-value">
                    Sin analizar
                </span>
            </div>

            <p>
                Escribe código AutoInfra en el editor.
                La conexión con el Backend se realizará
                en los siguientes pasos.
            </p>
        </section>
    );
}
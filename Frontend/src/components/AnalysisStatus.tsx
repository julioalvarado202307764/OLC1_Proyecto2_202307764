interface AnalysisStatusProps {
    analizado: boolean;
}


export function AnalysisStatus({
    analizado
}: AnalysisStatusProps) {
    return (
        <section className="status-panel">
            <div>
                <strong>Estado:</strong>

                <span className="status-value">
                    {
                        analizado
                            ? "Análisis completado"
                            : "Sin analizar"
                    }
                </span>
            </div>

            <p>
                {
                    analizado
                        ? "El Backend respondió correctamente."
                        : "Escribe código AutoInfra y presiona Analizar."
                }
            </p>
        </section>
    );
}
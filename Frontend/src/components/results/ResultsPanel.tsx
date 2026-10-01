import type {
    RespuestaAnalisis
} from "../../types/analisis.types";


interface ResultsPanelProps {
    resultado: RespuestaAnalisis | null;
}


export function ResultsPanel({
    resultado
}: ResultsPanelProps) {
    if (resultado === null) {
        return null;
    }


    return (
        <section className="results-panel">
            <div className="results-header">
                <h2>
                    Resultados del análisis
                </h2>
            </div>

            <div className="results-placeholder">
                <p>
                    Se recibió correctamente el resultado
                    del análisis.
                </p>
            </div>
        </section>
    );
}
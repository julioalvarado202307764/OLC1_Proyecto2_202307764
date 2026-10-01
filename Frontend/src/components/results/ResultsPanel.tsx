import type {
    RespuestaAnalisis
} from "../../types/analisis.types";

import {
    AnalysisSummary
} from "./AnalysisSummary";

import {
    ErrorsTable
} from "./ErrorsTable";

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

            <div className="results-content">
                <AnalysisSummary
                    resultado={resultado}
                />
                <ErrorsTable
                    errores={
                        resultado.reportes.errores.filas
                    }
                />
            </div>
        </section>
    );
}
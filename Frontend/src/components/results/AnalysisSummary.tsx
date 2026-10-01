import type {
    RespuestaAnalisis
} from "../../types/analisis.types";


interface AnalysisSummaryProps {
    resultado: RespuestaAnalisis;
}


export function AnalysisSummary({
    resultado
}: AnalysisSummaryProps) {
    const cantidadTokens =
        resultado.reportes
            .tablaTokens
            .filas
            .length;

    const cantidadErroresLexicos =
        resultado.erroresLexicos.length;

    const cantidadErroresSintacticos =
        resultado.erroresSintacticos.length;

    const astDisponible =
        resultado.reportes.ast.svg !== null;


    return (
        <section className="analysis-summary">
            <h3>
                Resumen
            </h3>

            <div className="summary-grid">
                <div className="summary-item">
                    <span className="summary-label">
                        Tokens
                    </span>

                    <strong>
                        {cantidadTokens}
                    </strong>
                </div>

                <div className="summary-item">
                    <span className="summary-label">
                        Errores léxicos
                    </span>

                    <strong>
                        {cantidadErroresLexicos}
                    </strong>
                </div>

                <div className="summary-item">
                    <span className="summary-label">
                        Errores sintácticos
                    </span>

                    <strong>
                        {cantidadErroresSintacticos}
                    </strong>
                </div>

                <div className="summary-item">
                    <span className="summary-label">
                        AST
                    </span>

                    <strong>
                        {
                            astDisponible
                                ? "Disponible"
                                : "No disponible"
                        }
                    </strong>
                </div>
            </div>
        </section>
    );
}
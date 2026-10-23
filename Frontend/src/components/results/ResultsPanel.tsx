import type {
    RespuestaAnalisis
} from "../../types/analisis.types";

import {
    AnalysisSummary
} from "./AnalysisSummary";

import {
    ErrorsTable
} from "./ErrorsTable";

import {
    TokensTable
} from "./TokensTable";

import {
    AstViewer
} from "./AstViewer";

import {
    ConsolePanel
} from "./ConsolePanel";

import {
    InfrastructureView
} from "./InfrastructureView";

import {
    SymbolsTable
} from "./SymbolsTable";

import {
    BitacoraTable
} from "./BitacoraTable";


interface ResultsPanelProps {
    resultado: RespuestaAnalisis | null;
}


export function ResultsPanel({
    resultado
}: ResultsPanelProps) {
    if (resultado === null) {
        return null;
    }

    const { reportes, ejecucion } = resultado;


    return (
        <section className="results-panel">
            <div className="results-header">
                <h2>
                    {
                        resultado.ejecutado
                            ? "Resultados de la ejecución"
                            : "Resultados del análisis"
                    }
                </h2>
            </div>

            <div className="results-content">
                <AnalysisSummary
                    resultado={resultado}
                />

                {
                    resultado.mensajeEjecucion !== null && (
                        <p className="execution-notice">
                            {resultado.mensajeEjecucion}
                        </p>
                    )
                }

                {
                    ejecucion !== null && (
                        <ConsolePanel
                            lineas={ejecucion.consola}
                        />
                    )
                }

                {
                    reportes.estadoFinal !== undefined && (
                        <InfrastructureView
                            recursos={reportes.estadoFinal.filas}
                        />
                    )
                }

                <ErrorsTable
                    errores={reportes.errores.filas}
                />

                {
                    reportes.tablaSimbolos !== undefined && (
                        <SymbolsTable
                            simbolos={reportes.tablaSimbolos.filas}
                        />
                    )
                }

                {
                    reportes.bitacora !== undefined && (
                        <BitacoraTable
                            entradas={reportes.bitacora.filas}
                        />
                    )
                }

                <TokensTable
                    tokens={reportes.tablaTokens.filas}
                />

                <AstViewer
                    svg={reportes.ast.svg}
                />
            </div>
        </section>
    );
}

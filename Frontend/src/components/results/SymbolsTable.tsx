import type {
    FilaReporteSimbolo
} from "../../types/analisis.types";


interface SymbolsTableProps {
    simbolos: FilaReporteSimbolo[];
}


export function SymbolsTable({
    simbolos
}: SymbolsTableProps) {
    return (
        <section className="report-section">
            <h3>
                Tabla de símbolos
            </h3>

            {
                simbolos.length === 0
                    ? (
                        <p className="empty-report">
                            No hay símbolos registrados.
                        </p>
                    )
                    : (
                        <div className="table-container">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>No.</th>
                                        <th>Identificador</th>
                                        <th>Categoría</th>
                                        <th>Tipo</th>
                                        <th>Ámbito</th>
                                        <th>Valor / Estado</th>
                                        <th>Línea</th>
                                        <th>Columna</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        simbolos.map(
                                            (s) => (
                                                <tr key={s.numero}>
                                                    <td>{s.numero}</td>
                                                    <td>{s.identificador}</td>
                                                    <td>{s.categoria}</td>
                                                    <td>{s.tipo}</td>
                                                    <td>{s.ambito}</td>
                                                    <td>{s.valor}</td>
                                                    <td>{s.linea}</td>
                                                    <td>{s.columna}</td>
                                                </tr>
                                            )
                                        )
                                    }
                                </tbody>
                            </table>
                        </div>
                    )
            }
        </section>
    );
}

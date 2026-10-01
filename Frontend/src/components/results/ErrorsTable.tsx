import type {
    FilaReporteError
} from "../../types/analisis.types";


interface ErrorsTableProps {
    errores: FilaReporteError[];
}


export function ErrorsTable({
    errores
}: ErrorsTableProps) {
    return (
        <section className="report-section">
            <h3>
                Errores léxicos y sintácticos
            </h3>

            {
                errores.length === 0
                    ? (
                        <p className="empty-report">
                            No se encontraron errores léxicos
                            ni sintácticos.
                        </p>
                    )
                    : (
                        <div className="table-container">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>No.</th>
                                        <th>Tipo</th>
                                        <th>Código</th>
                                        <th>Descripción</th>
                                        <th>Línea</th>
                                        <th>Columna</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        errores.map(
                                            (error) => (
                                                <tr key={error.numero}>
                                                    <td>
                                                        {error.numero}
                                                    </td>

                                                    <td>
                                                        {error.tipo}
                                                    </td>

                                                    <td>
                                                        {
                                                            error.codigo ??
                                                            "—"
                                                        }
                                                    </td>

                                                    <td>
                                                        {error.descripcion}
                                                    </td>

                                                    <td>
                                                        {error.linea}
                                                    </td>

                                                    <td>
                                                        {error.columna}
                                                    </td>
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
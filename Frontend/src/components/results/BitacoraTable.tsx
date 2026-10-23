import type {
    FilaBitacora
} from "../../types/analisis.types";


interface BitacoraTableProps {
    entradas: FilaBitacora[];
}


export function BitacoraTable({
    entradas
}: BitacoraTableProps) {
    return (
        <section className="report-section">
            <h3>
                Bitácora de ejecución
            </h3>

            {
                entradas.length === 0
                    ? (
                        <p className="empty-report">
                            La ejecución no registró acciones.
                        </p>
                    )
                    : (
                        <div className="table-container">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>No.</th>
                                        <th>Nivel</th>
                                        <th>Mensaje</th>
                                        <th>Línea</th>
                                        <th>Columna</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        entradas.map(
                                            (b) => (
                                                <tr key={b.numero}>
                                                    <td>{b.numero}</td>
                                                    <td>{b.nivel}</td>
                                                    <td>{b.mensaje}</td>
                                                    <td>{b.linea ?? "—"}</td>
                                                    <td>{b.columna ?? "—"}</td>
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

import type {
    FilaEstadoFinal
} from "../../types/analisis.types";


interface InfrastructureViewProps {
    recursos: FilaEstadoFinal[];
}


export function InfrastructureView({
    recursos
}: InfrastructureViewProps) {
    return (
        <section className="report-section">
            <h3>
                Estado final de infraestructura
            </h3>

            {
                recursos.length === 0
                    ? (
                        <p className="empty-report">
                            El programa no declara recursos.
                        </p>
                    )
                    : (
                        <div className="resource-cards">
                            {
                                recursos.map(
                                    (r) => (
                                        <article
                                            key={r.recurso}
                                            className="resource-card"
                                        >
                                            <header>
                                                <strong>{r.recurso}</strong>

                                                <span
                                                    className={
                                                        `badge badge-${r.estado}`
                                                    }
                                                >
                                                    {r.estado}
                                                </span>
                                            </header>

                                            <div className="resource-type">
                                                {r.tipo}
                                            </div>

                                            <div className="resource-details">
                                                {r.detalles}
                                            </div>
                                        </article>
                                    )
                                )
                            }
                        </div>
                    )
            }

            {
                recursos.length > 0 && (
                    <div className="table-container">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th>Recurso</th>
                                    <th>Tipo</th>
                                    <th>Estado</th>
                                    <th>Detalles</th>
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    recursos.map(
                                        (r) => (
                                            <tr key={r.recurso}>
                                                <td>{r.recurso}</td>
                                                <td>{r.tipo}</td>
                                                <td>{r.estado}</td>
                                                <td>{r.detalles}</td>
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

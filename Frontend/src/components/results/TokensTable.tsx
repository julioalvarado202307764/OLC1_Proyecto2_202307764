import type {
    FilaReporteToken
} from "../../types/analisis.types";


interface TokensTableProps {
    tokens: FilaReporteToken[];
}


export function TokensTable({
    tokens
}: TokensTableProps) {
    return (
        <section className="report-section">
            <h3>
                Tokens
            </h3>

            {
                tokens.length === 0
                    ? (
                        <p className="empty-report">
                            No se encontraron tokens.
                        </p>
                    )
                    : (
                        <div className="table-container">
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th>No.</th>
                                        <th>Lexema</th>
                                        <th>Token</th>
                                        <th>Línea</th>
                                        <th>Columna</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        tokens.map(
                                            (token) => (
                                                <tr key={token.numero}>
                                                    <td>
                                                        {token.numero}
                                                    </td>

                                                    <td className="token-lexeme">
                                                        {token.lexema}
                                                    </td>

                                                    <td>
                                                        {token.token}
                                                    </td>

                                                    <td>
                                                        {token.linea}
                                                    </td>

                                                    <td>
                                                        {token.columna}
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
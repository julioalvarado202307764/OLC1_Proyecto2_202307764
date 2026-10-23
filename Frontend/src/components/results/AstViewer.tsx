interface AstViewerProps {
    svg: string | null;
}


export function AstViewer({
    svg
}: AstViewerProps) {
    return (
        <section className="report-section">
            <h3>
                Árbol de sintaxis abstracta
            </h3>

            {
                svg === null
                    ? (
                        <p className="empty-report">
                            No hay un AST disponible para
                            este análisis.
                        </p>
                    )
                    : (
                        <div className="ast-container">
                            <img
                                className="ast-image"
                                src={
                                    "data:image/svg+xml;charset=utf-8," +
                                    encodeURIComponent(svg)
                                }
                                alt="Árbol de sintaxis abstracta"
                            />
                        </div>
                    )
            }
        </section>
    );
}

import {
    useEffect,
    useState
} from "react";


interface AstViewerProps {
    svg: string | null;
}


export function AstViewer({
    svg
}: AstViewerProps) {
    const [
        svgUrl,
        setSvgUrl
    ] = useState<string | null>(
        null
    );


    useEffect(() => {
        if (svg === null) {
            setSvgUrl(null);

            return;
        }


        const blob =
            new Blob(
                [svg],
                {
                    type: "image/svg+xml;charset=utf-8"
                }
            );

        const url =
            URL.createObjectURL(blob);

        setSvgUrl(url);


        return () => {
            URL.revokeObjectURL(url);
        };
    }, [svg]);


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
                    : svgUrl === null
                        ? (
                            <p className="empty-report">
                                Preparando visualización...
                            </p>
                        )
                        : (
                            <div className="ast-container">
                                <img
                                    className="ast-image"
                                    src={svgUrl}
                                    alt="Árbol de sintaxis abstracta"
                                />
                            </div>
                        )
            }
        </section>
    );
}
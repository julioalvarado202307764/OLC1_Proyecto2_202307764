interface ConsolePanelProps {
    lineas: string[];
}


function claseLinea(linea: string): string {
    if (linea.startsWith("[OK]")) {
        return "console-ok";
    }

    if (linea.startsWith("[FAIL]")) {
        return "console-fail";
    }

    if (linea.startsWith("[ERROR]")) {
        return "console-error";
    }

    return "";
}


export function ConsolePanel({
    lineas
}: ConsolePanelProps) {
    return (
        <section className="report-section">
            <h3>
                Consola
            </h3>

            {
                lineas.length === 0
                    ? (
                        <p className="empty-report">
                            El programa no produjo salida.
                        </p>
                    )
                    : (
                        <pre className="console-output">
                            {
                                lineas.map(
                                    (linea, i) => (
                                        <div
                                            key={i}
                                            className={claseLinea(linea)}
                                        >
                                            {linea === "" ? " " : linea}
                                        </div>
                                    )
                                )
                            }
                        </pre>
                    )
            }
        </section>
    );
}

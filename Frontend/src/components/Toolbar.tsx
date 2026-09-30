interface ToolbarProps {
    onAnalyze: () => void;
    analizando: boolean;
}


export function Toolbar({
    onAnalyze,
    analizando
}: ToolbarProps) {
    return (
        <header className="toolbar">
            <div className="toolbar-brand">
                <h1>AutoInfra</h1>

                <span>
                    Analizador de infraestructura
                </span>
            </div>

            <div className="toolbar-actions">
                <button
                    type="button"
                    className="primary-button"
                    onClick={onAnalyze}
                    disabled={analizando}
                >
                    {
                        analizando
                            ? "Analizando..."
                            : "Analizar"
                    }
                </button>
            </div>
        </header>
    );
}
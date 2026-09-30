interface ToolbarProps {
    onAnalyze: () => void;
}


export function Toolbar({
    onAnalyze
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
                >
                    Analizar
                </button>
            </div>
        </header>
    );
}
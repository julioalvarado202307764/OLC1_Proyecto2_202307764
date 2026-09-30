export function Toolbar() {
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
                    disabled
                    title="Se habilitará al conectar el Backend"
                >
                    Analizar
                </button>
            </div>
        </header>
    );
}
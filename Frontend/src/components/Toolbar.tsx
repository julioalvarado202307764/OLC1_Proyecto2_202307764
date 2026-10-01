import {
    useRef
} from "react";


interface ToolbarProps {
    onNew: () => void;
    onOpen: (archivo: File) => void;
    onAnalyze: () => void;
    analizando: boolean;
}


export function Toolbar({
    onNew,
    onOpen,
    onAnalyze,
    analizando
}: ToolbarProps) {
    const inputArchivoRef =
        useRef<HTMLInputElement>(null);


    function seleccionarArchivo(): void {
        inputArchivoRef.current?.click();
    }


    function manejarArchivoSeleccionado(
        event: React.ChangeEvent<HTMLInputElement>
    ): void {
        const archivo =
            event.target.files?.[0];

        if (archivo) {
            onOpen(archivo);
        }

        /*
         * Permite volver a seleccionar posteriormente
         * el mismo archivo.
         */
        event.target.value = "";
    }


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
                    onClick={onNew}
                    disabled={analizando}
                >
                    Nuevo
                </button>

                <button
                    type="button"
                    className="primary-button"
                    onClick={seleccionarArchivo}
                    disabled={analizando}
                >
                    Abrir
                </button>

                <input
                    ref={inputArchivoRef}
                    type="file"
                    accept=".infra"
                    onChange={manejarArchivoSeleccionado}
                    hidden
                />

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
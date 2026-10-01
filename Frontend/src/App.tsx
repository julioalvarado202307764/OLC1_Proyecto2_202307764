import {
    useState
} from "react";

import { Toolbar } from "./components/Toolbar";
import { CodeEditor } from "./components/CodeEditor";

import {
    AnalysisStatus
} from "./components/AnalysisStatus";

import type {
    EstadoAnalisis
} from "./components/AnalysisStatus";

import {
    analizarCodigo
} from "./services/analisis.service";

import type {
    RespuestaAnalisis
} from "./types/analisis.types";

import "./App.css";


function App() {
    const [codigo, setCodigo] =
        useState<string>("");

    const [
        nombreArchivo,
        setNombreArchivo
    ] = useState<string>("nuevo.infra");

    const [, setResultado] =
        useState<RespuestaAnalisis | null>(null);

    const [
        estadoAnalisis,
        setEstadoAnalisis
    ] = useState<EstadoAnalisis>(
        "sin-analizar"
    );

    const [
        mensajeError,
        setMensajeError
    ] = useState<string | null>(
        null
    );

    function manejarNuevo(): void {
        setCodigo("");
        setNombreArchivo("nuevo.infra");

        setResultado(null);

        setEstadoAnalisis(
            "sin-analizar"
        );

        setMensajeError(null);
    }

    async function manejarAnalisis(): Promise<void> {
        setEstadoAnalisis("analizando");
        setMensajeError(null);

        try {
            const respuesta =
                await analizarCodigo(codigo);

            setResultado(respuesta);

            setEstadoAnalisis(
                "completado"
            );

        } catch (error: unknown) {
            /*
             * Una petición fallida no debe conservar
             * el resultado de un análisis anterior.
             */
            setResultado(null);

            setEstadoAnalisis(
                "error"
            );

            if (error instanceof Error) {
                setMensajeError(
                    error.message
                );
            } else {
                setMensajeError(
                    "Ocurrió un error inesperado al comunicarse con el Backend."
                );
            }
        }
    }


    return (
        <div className="app">
            <Toolbar
                onNew={manejarNuevo}
                onAnalyze={() => {
                    void manejarAnalisis();
                }}
                analizando={
                    estadoAnalisis ===
                    "analizando"
                }
            />

            <main className="workspace">
                <CodeEditor
                    value={codigo}
                    nombreArchivo={nombreArchivo}
                    onChange={setCodigo}
                />

                <AnalysisStatus
                    estado={estadoAnalisis}
                    mensajeError={mensajeError}
                />
            </main>
        </div>
    );
}


export default App;
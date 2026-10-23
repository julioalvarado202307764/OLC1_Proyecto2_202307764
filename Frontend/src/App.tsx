import {
    useState
} from "react";

import { Toolbar } from "./components/Toolbar";
import { CodeEditor } from "./components/CodeEditor";

import {
    AnalysisStatus
} from "./components/AnalysisStatus";

import type {
    AccionAnalisis,
    EstadoAnalisis
} from "./components/AnalysisStatus";

import {
    analizarCodigo,
    ejecutarCodigo
} from "./services/analisis.service";

import type {
    RespuestaAnalisis
} from "./types/analisis.types";

import "./App.css";

import {
    descargarArchivoInfra,
    leerArchivoInfra,
    normalizarNombreInfra
} from "./services/archivo.service";

import {
    ResultsPanel
} from "./components/results/ResultsPanel";

function App() {
    const [codigo, setCodigo] =
        useState<string>("");

    const [
        nombreArchivo,
        setNombreArchivo
    ] = useState<string>("nuevo.infra");

    const [
        resultado,
        setResultado
    ] = useState<RespuestaAnalisis | null>(
        null
    );

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

    const [
        accion,
        setAccion
    ] = useState<AccionAnalisis>(
        "analizar"
    );

    function manejarCambioCodigo(
        nuevoCodigo: string
    ): void {
        setCodigo(nuevoCodigo);

        setResultado(null);

        setEstadoAnalisis(
            "sin-analizar"
        );

        setMensajeError(null);
    }

    function manejarNuevo(): void {
        setCodigo("");
        setNombreArchivo("nuevo.infra");

        setResultado(null);

        setEstadoAnalisis(
            "sin-analizar"
        );

        setMensajeError(null);
    }

    async function manejarAbrir(
        archivo: File
    ): Promise<void> {
        try {
            const contenido =
                await leerArchivoInfra(archivo);

            setCodigo(contenido);

            setNombreArchivo(
                archivo.name
            );

            setResultado(null);

            setEstadoAnalisis(
                "sin-analizar"
            );

            setMensajeError(null);

        } catch (error: unknown) {
            const mensaje =
                error instanceof Error
                    ? error.message
                    : "No fue posible abrir el archivo.";

            window.alert(mensaje);
        }
    }

    function manejarGuardar(): void {
        descargarArchivoInfra(
            codigo,
            nombreArchivo
        );
    }
    function manejarGuardarComo(): void {
        const nombreIngresado =
            window.prompt(
                "Nombre del archivo:",
                nombreArchivo
            );

        if (nombreIngresado === null) {
            return;
        }


        if (nombreIngresado.trim() === "") {
            window.alert(
                "El nombre del archivo no puede estar vacío."
            );

            return;
        }


        const nuevoNombre =
            normalizarNombreInfra(
                nombreIngresado
            );

        descargarArchivoInfra(
            codigo,
            nuevoNombre
        );

        setNombreArchivo(
            nuevoNombre
        );
    }

    async function procesar(
        nuevaAccion: AccionAnalisis
    ): Promise<void> {
        setAccion(nuevaAccion);
        setEstadoAnalisis("analizando");
        setMensajeError(null);
        setResultado(null);
        try {
            const respuesta =
                nuevaAccion === "ejecutar"
                    ? await ejecutarCodigo(codigo)
                    : await analizarCodigo(codigo);

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
                onOpen={(archivo) => {
                    void manejarAbrir(archivo);
                }}
                onSave={manejarGuardar}
                onSaveAs={manejarGuardarComo}
                onAnalyze={() => {
                    void procesar("analizar");
                }}
                onExecute={() => {
                    void procesar("ejecutar");
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
                    onChange={manejarCambioCodigo}
                />

                <AnalysisStatus
                    estado={estadoAnalisis}
                    mensajeError={mensajeError}
                    accion={accion}
                    exitoEjecucion={
                        resultado?.ejecucion?.exito ?? null
                    }
                    erroresLexicos={
                        resultado?.erroresLexicos.length ?? 0
                    }
                />
                <ResultsPanel
                    resultado={resultado}
                />
            </main>
        </div>
    );
}


export default App;
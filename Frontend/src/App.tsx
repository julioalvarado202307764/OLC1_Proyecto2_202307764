import {
    useState
} from "react";

import { Toolbar } from "./components/Toolbar";
import { CodeEditor } from "./components/CodeEditor";
import { AnalysisStatus } from "./components/AnalysisStatus";

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
        resultado,
        setResultado
    ] = useState<RespuestaAnalisis | null>(
        null
    );


    async function manejarAnalisis(): Promise<void> {
        const respuesta =
            await analizarCodigo(codigo);

        setResultado(respuesta);
    }


    return (
        <div className="app">
            <Toolbar
                onAnalyze={() => {
                    void manejarAnalisis();
                }}
            />

            <main className="workspace">
                <CodeEditor
                    value={codigo}
                    onChange={setCodigo}
                />

                <AnalysisStatus
                    analizado={resultado !== null}
                />
            </main>
        </div>
    );
}


export default App;
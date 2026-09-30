import { useState } from "react";

import { Toolbar } from "./components/Toolbar";
import { CodeEditor } from "./components/CodeEditor";
import { AnalysisStatus } from "./components/AnalysisStatus";

import "./App.css";


function App() {
    const [codigo, setCodigo] =
        useState<string>("");


    return (
        <div className="app">
            <Toolbar />

            <main className="workspace">
                <CodeEditor
                    value={codigo}
                    onChange={setCodigo}
                />

                <AnalysisStatus />
            </main>
        </div>
    );
}


export default App;
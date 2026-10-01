interface CodeEditorProps {
    value: string;
    nombreArchivo: string;
    onChange: (value: string) => void;
}


export function CodeEditor({
    value,
    nombreArchivo,
    onChange
}: CodeEditorProps) {
    return (
        <section className="editor-panel">
            <div className="panel-header">
                <h2>Editor AutoInfra</h2>

                <span className="file-label">
                    {nombreArchivo}
                </span>
            </div>

            <textarea
                className="code-editor"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={`main {
    print("Hola AutoInfra");
}`}
                spellCheck={false}
                aria-label="Editor de código AutoInfra"
            />
        </section>
    );
}
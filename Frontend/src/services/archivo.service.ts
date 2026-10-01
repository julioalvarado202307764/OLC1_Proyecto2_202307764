export async function leerArchivoInfra(
    archivo: File
): Promise<string> {
    const nombre =
        archivo.name.toLowerCase();

    if (!nombre.endsWith(".infra")) {
        throw new Error(
            "Solo se pueden abrir archivos con extensión .infra."
        );
    }

    return await archivo.text();
}

export function normalizarNombreInfra(
    nombre: string
): string {
    const nombreLimpio =
        nombre.trim();

    if (
        nombreLimpio
            .toLowerCase()
            .endsWith(".infra")
    ) {
        return nombreLimpio;
    }

    return `${nombreLimpio}.infra`;
}


export function descargarArchivoInfra(
    contenido: string,
    nombreArchivo: string
): void {
    const blob =
        new Blob(
            [contenido],
            {
                type: "text/plain;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const enlace =
        document.createElement("a");

    enlace.href = url;
    enlace.download = nombreArchivo;

    document.body.appendChild(enlace);

    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
}
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
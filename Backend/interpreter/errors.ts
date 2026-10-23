/* =========================================================
   ERRORES DE EJECUCIÓN
   ========================================================= */

export type TipoErrorEjecucion = "Ejecución" | "Infraestructura";

export interface ErrorEjecucionInfo {
    tipo: TipoErrorEjecucion;
    codigo: string | null;
    descripcion: string;
    linea: number;
    columna: number;
}

/**
 * Error producido DURANTE la ejecución (no durante el análisis).
 * Detiene la ejecución del programa.
 */
export class ErrorEjecucion extends Error {
    constructor(
        mensaje: string,
        public readonly linea: number,
        public readonly columna: number,
        public readonly tipo: TipoErrorEjecucion = "Ejecución",
        public readonly codigo: string | null = null
    ) {
        super(mensaje);
        this.name = "ErrorEjecucion";
    }
}

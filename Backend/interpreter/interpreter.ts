import { Entorno } from "./environment";
import type { Simbolo } from "./environment";
import { Contexto } from "./context";
import type { EntradaBitacora } from "./context";
import { ErrorEjecucion } from "./errors";
import type { ErrorEjecucionInfo } from "./errors";
import { construirPrograma } from "./nodes";
import type { Conexion, Recurso } from "./infrastructure";

/* =========================================================
   INTÉRPRETE: punto de entrada de la ejecución
   ========================================================= */

export interface ResultadoEjecucion {
    exito: boolean;
    /** true si la ejecución se interrumpió por un error de ejecución. */
    abortada: boolean;
    consola: string[];
    salida: string[];
    bitacora: EntradaBitacora[];
    errores: ErrorEjecucionInfo[];
    simbolos: Simbolo[];
    recursos: Recurso[];
    conexiones: Conexion[];
}

export function ejecutarPrograma(ast: unknown): ResultadoEjecucion {
    const ctx = new Contexto();
    const global = new Entorno("global", null, ctx);
    ctx.fijarEntornoGlobal(global);

    let abortada = false;

    try {
        construirPrograma(ast).ejecutar(global);
    } catch (error: unknown) {
        abortada = true;

        if (error instanceof ErrorEjecucion) {
            ctx.registrarError(error);
        } else if (error instanceof RangeError) {
            ctx.registrarError(new ErrorEjecucion(
                "Desbordamiento de pila durante la ejecución (recursión sin fin).", 0, 0
            ));
        } else {
            const mensaje = error instanceof Error ? error.message : String(error);
            ctx.registrarError(new ErrorEjecucion(
                `Error interno de ejecución: ${mensaje}`, 0, 0
            ));
        }
    }

    return {
        exito: ctx.errores.length === 0,
        abortada,
        consola: ctx.consola,
        salida: ctx.salida,
        bitacora: ctx.bitacora,
        errores: ctx.errores,
        simbolos: ctx.listaSimbolos(),
        recursos: ctx.recursos,
        conexiones: ctx.conexiones
    };
}

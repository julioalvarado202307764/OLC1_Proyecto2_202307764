import { ErrorEjecucion } from "./errors";
import type { ErrorEjecucionInfo } from "./errors";
import type { Entorno, Simbolo } from "./environment";
import type { Conexion, Recurso } from "./infrastructure";
import type { FuncionDeclarada, TaskDeclarada } from "./nodes";

/* =========================================================
   CONTEXTO DE EJECUCIÓN
   Estado compartido por todos los entornos de una ejecución.
   ========================================================= */

export type NivelBitacora = "OK" | "FAIL" | "ERROR";

export interface EntradaBitacora {
    nivel: NivelBitacora;
    mensaje: string;
    linea: number | null;
    columna: number | null;
}

export class Contexto {
    readonly funciones = new Map<string, FuncionDeclarada>();
    readonly tasks = new Map<string, TaskDeclarada>();
    readonly recursos: Recurso[] = [];
    readonly conexiones: Conexion[] = [];

    /** Salida completa: print y bitácora, en orden de ocurrencia. */
    readonly consola: string[] = [];
    /** Únicamente lo escrito con print. */
    readonly salida: string[] = [];
    readonly bitacora: EntradaBitacora[] = [];
    readonly errores: ErrorEjecucionInfo[] = [];

    private readonly simbolos = new Map<string, Simbolo>();
    private global: Entorno | null = null;

    fijarEntornoGlobal(e: Entorno): void {
        this.global = e;
    }

    entornoGlobal(): Entorno {
        if (this.global === null) {
            throw new Error("El entorno global no ha sido inicializado.");
        }
        return this.global;
    }

    registrarSimbolo(s: Simbolo): void {
        /*
         * Una declaración que se ejecuta muchas veces (recursión,
         * ciclos) comparte la misma fila: ámbito + nombre + posición.
         */
        this.simbolos.set(`${s.ambito}|${s.nombre}|${s.linea}|${s.columna}`, s);
    }

    listaSimbolos(): Simbolo[] {
        return [...this.simbolos.values()];
    }

    imprimir(texto: string): void {
        this.salida.push(texto);
        this.consola.push(texto);
    }

    log(
        nivel: NivelBitacora,
        mensaje: string,
        linea: number | null = null,
        columna: number | null = null
    ): void {
        this.bitacora.push({ nivel, mensaje, linea, columna });
        this.consola.push(`[${nivel}] ${mensaje}`);
    }

    /** Registra un error de infraestructura y deja que la ejecución continúe. */
    errorInfraestructura(
        mensaje: string,
        codigo: string,
        linea: number,
        columna: number
    ): void {
        this.errores.push({
            tipo: "Infraestructura",
            codigo,
            descripcion: mensaje,
            linea,
            columna
        });
        this.log("ERROR", `${codigo}: ${mensaje}`, linea, columna);
    }

    registrarError(e: ErrorEjecucion): void {
        this.errores.push({
            tipo: e.tipo,
            codigo: e.codigo,
            descripcion: e.message,
            linea: e.linea,
            columna: e.columna
        });
        this.log("ERROR", e.message, e.linea, e.columna);
    }
}

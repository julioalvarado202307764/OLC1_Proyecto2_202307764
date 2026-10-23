import type { Valor, TipoDeclarado } from "./values";
import type { Contexto } from "./context";

/* =========================================================
   TABLA DE SÍMBOLOS Y ENTORNOS
   ========================================================= */

export type CategoriaSimbolo =
    | "variable"
    | "parámetro"
    | "recurso"
    | "función"
    | "task";

export interface Simbolo {
    nombre: string;
    categoria: CategoriaSimbolo;
    tipo: string;
    ambito: string;
    valor: Valor | null;
    tipoDeclarado: TipoDeclarado | null;
    detalle?: string;
    linea: number;
    columna: number;
}

/**
 * Entorno de ejecución. Cada bloque, función, task y main crea un
 * entorno enlazado a su padre; la búsqueda de identificadores
 * recorre la cadena de entornos (los locales ocultan a los externos).
 */
export class Entorno {
    private readonly tabla = new Map<string, Simbolo>();

    constructor(
        public readonly nombre: string,
        public readonly padre: Entorno | null,
        public readonly ctx: Contexto
    ) { }

    hijo(etiqueta: string): Entorno {
        return new Entorno(`${this.nombre} > ${etiqueta}`, this, this.ctx);
    }

    declarar(
        datos: Omit<Simbolo, "ambito">
    ): Simbolo {
        const simbolo: Simbolo = { ...datos, ambito: this.nombre };
        this.tabla.set(simbolo.nombre, simbolo);
        this.ctx.registrarSimbolo(simbolo);
        return simbolo;
    }

    buscar(nombre: string): Simbolo | null {
        let actual: Entorno | null = this;

        while (actual !== null) {
            const s = actual.tabla.get(nombre);
            if (s) {
                return s;
            }
            actual = actual.padre;
        }

        return null;
    }
}

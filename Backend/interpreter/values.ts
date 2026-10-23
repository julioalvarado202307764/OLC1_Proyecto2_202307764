import type { Recurso } from "./infrastructure";

/* =========================================================
   VALORES EN TIEMPO DE EJECUCIÓN
   ========================================================= */

export type Valor =
    | { t: "int"; v: number }
    | { t: "float"; v: number }
    | { t: "string"; v: string }
    | { t: "bool"; v: boolean }
    | { t: "null" }
    | { t: "array"; v: Valor[] }
    | { t: "resource"; v: Recurso };

export interface TipoDeclarado {
    name: string;
    isArray: boolean;
}

export const VNULL: Valor = { t: "null" };

export const vInt = (v: number): Valor => ({ t: "int", v });
export const vFloat = (v: number): Valor => ({ t: "float", v });
export const vStr = (v: string): Valor => ({ t: "string", v });
export const vBool = (v: boolean): Valor => ({ t: "bool", v });
export const vArr = (v: Valor[]): Valor => ({ t: "array", v });
export const vRes = (v: Recurso): Valor => ({ t: "resource", v });

export function esNumero(v: Valor): v is Extract<Valor, { t: "int" | "float" }> {
    return v.t === "int" || v.t === "float";
}

export function nombreTipo(t: TipoDeclarado): string {
    return t.isArray ? `${t.name}[]` : t.name;
}

/** Valor por defecto según el tipo (sección 5.1 del enunciado). */
export function valorPorDefecto(t: TipoDeclarado): Valor {
    if (t.isArray) {
        return vArr([]);
    }

    switch (t.name) {
        case "int":
            return vInt(0);
        case "float":
            return vFloat(0);
        case "string":
            return vStr("");
        case "bool":
            return vBool(false);
        default:
            return VNULL;
    }
}

/**
 * Conversión de valor al tipo declarado (no es una validación):
 *  - int -> float cuando el destino es float.
 *  - float entero -> int cuando el destino es int (p. ej. 10 / 2).
 */
export function coaccionar(v: Valor, t: TipoDeclarado | null): Valor {
    if (t === null) {
        return v;
    }

    if (t.isArray) {
        if (v.t === "array" && t.name === "float") {
            return vArr(v.v.map((e) => coaccionar(e, { name: "float", isArray: false })));
        }
        return v;
    }

    if (t.name === "float" && v.t === "int") {
        return vFloat(v.v);
    }

    if (t.name === "int" && v.t === "float" && Number.isInteger(v.v)) {
        return vInt(v.v);
    }

    return v;
}

export function formatearNumero(v: Valor): string {
    if (v.t === "float") {
        return Number.isInteger(v.v) ? `${v.v}.0` : String(v.v);
    }
    return String((v as { v: number }).v);
}

/** Representación textual (print, concatenación y reportes). */
export function formatear(v: Valor): string {
    switch (v.t) {
        case "int":
        case "float":
            return formatearNumero(v);
        case "string":
            return v.v;
        case "bool":
            return v.v ? "true" : "false";
        case "null":
            return "null";
        case "array":
            return `[${v.v.map(formatear).join(", ")}]`;
        case "resource":
            return v.v.nombre;
    }
}

export function aBool(v: Valor): boolean {
    switch (v.t) {
        case "bool":
            return v.v;
        case "int":
        case "float":
            return v.v !== 0;
        case "string":
            return v.v.length > 0;
        case "null":
            return false;
        default:
            return true;
    }
}

export function igualdad(a: Valor, b: Valor): boolean {
    if (esNumero(a) && esNumero(b)) {
        return a.v === b.v;
    }
    if (a.t !== b.t) {
        return false;
    }
    switch (a.t) {
        case "string":
        case "bool":
            return a.v === (b as typeof a).v;
        case "null":
            return true;
        case "resource":
            return a.v === (b as typeof a).v;
        case "array":
            return a === b;
        default:
            return false;
    }
}

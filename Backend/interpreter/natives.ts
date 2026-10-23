import { ErrorEjecucion } from "./errors";
import { Recurso } from "./infrastructure";
import type { TipoRecurso } from "./infrastructure";
import type { Contexto } from "./context";
import {
    VNULL, formatear, vArr, vBool, vInt, vRes, vStr
} from "./values";
import type { Valor } from "./values";

/* =========================================================
   FUNCIONES NATIVAS DE AUTOINFRA (secciones 10 y 29)
   ========================================================= */

export interface Posicion {
    linea: number;
    columna: number;
}

type Nativa = (ctx: Contexto, args: Valor[], pos: Posicion) => Valor;


/* ---------- utilidades de argumentos ---------- */

function aridad(nombre: string, args: Valor[], n: number, pos: Posicion): void {
    if (args.length !== n) {
        throw new ErrorEjecucion(
            `${nombre}() espera ${n} argumento(s) y recibió ${args.length}.`,
            pos.linea, pos.columna
        );
    }
}

function recurso(
    nombre: string,
    args: Valor[],
    i: number,
    tipos: TipoRecurso[],
    pos: Posicion
): Recurso {
    const v = args[i];
    if (v.t !== "resource" || !tipos.includes(v.v.tipo)) {
        throw new ErrorEjecucion(
            `${nombre}(): el argumento ${i + 1} debe ser ${tipos.join(" o ")}.`,
            pos.linea, pos.columna
        );
    }
    return v.v;
}

function texto(nombre: string, args: Valor[], i: number, pos: Posicion): string {
    const v = args[i];
    if (v.t !== "string") {
        throw new ErrorEjecucion(
            `${nombre}(): el argumento ${i + 1} debe ser string.`,
            pos.linea, pos.columna
        );
    }
    return v.v;
}

const TODOS: TipoRecurso[] = ["server", "service", "database"];


/* ---------- acciones ---------- */

const start: Nativa = (ctx, args, pos) => {
    aridad("start", args, 1, pos);
    const r = recurso("start", args, 0, TODOS, pos);

    if (r.estado !== "stopped" && r.estado !== "failed") {
        return vBool(false);
    }

    r.estado = "running";
    ctx.log("OK", `${r.nombre} started`, pos.linea, pos.columna);
    return vBool(true);
};

const stop: Nativa = (ctx, args, pos) => {
    aridad("stop", args, 1, pos);
    const r = recurso("stop", args, 0, TODOS, pos);

    if (r.estado === "stopped") {
        ctx.log("FAIL", `${r.nombre} is already stopped`, pos.linea, pos.columna);
        return vBool(false);
    }

    r.estado = "stopped";
    ctx.log("OK", `${r.nombre} stopped`, pos.linea, pos.columna);
    return vBool(true);
};

const restart: Nativa = (ctx, args, pos) => {
    aridad("restart", args, 1, pos);
    const r = recurso("restart", args, 0, TODOS, pos);

    if (r.estado !== "running") {
        ctx.log("FAIL", `${r.nombre} is not running; cannot restart`, pos.linea, pos.columna);
        return vBool(false);
    }

    ctx.log("OK", `${r.nombre} restarted`, pos.linea, pos.columna);
    return vBool(true);
};

const install: Nativa = (ctx, args, pos) => {
    aridad("install", args, 2, pos);
    const s = recurso("install", args, 0, ["server"], pos);
    const paquete = texto("install", args, 1, pos);

    if (s.paquetes().includes(paquete)) {
        ctx.log("FAIL", `${paquete} is already installed on ${s.nombre}`, pos.linea, pos.columna);
        return vBool(false);
    }

    const actual = s.obtener("packages");
    const lista = actual.t === "array" ? actual.v : [];
    s.asignar("packages", vArr([...lista, vStr(paquete)]));
    ctx.log("OK", `${paquete} installed on ${s.nombre}`, pos.linea, pos.columna);
    return vBool(true);
};

const uninstall: Nativa = (ctx, args, pos) => {
    aridad("uninstall", args, 2, pos);
    const s = recurso("uninstall", args, 0, ["server"], pos);
    const paquete = texto("uninstall", args, 1, pos);

    if (!s.paquetes().includes(paquete)) {
        ctx.log("FAIL", `${paquete} is not installed on ${s.nombre}`, pos.linea, pos.columna);
        return vBool(false);
    }

    const actual = s.obtener("packages");
    const lista = actual.t === "array" ? actual.v : [];
    const idx = lista.findIndex((e) => e.t === "string" && e.v === paquete);
    s.asignar("packages", vArr(lista.filter((_, i) => i !== idx)));
    ctx.log("OK", `${paquete} uninstalled from ${s.nombre}`, pos.linea, pos.columna);
    return vBool(true);
};

const deploy: Nativa = (ctx, args, pos) => {
    aridad("deploy", args, 2, pos);
    const s = recurso("deploy", args, 0, ["server"], pos);
    const api = recurso("deploy", args, 1, ["service"], pos);

    /*
     * Dependencias (sección 12): todas deben existir y estar running.
     * Se valida ANTES de modificar el entorno (atomicidad, 12.2).
     */
    const deps = api.obtener("dependsOn");

    if (deps.t === "array") {
        for (const d of deps.v) {
            if (d.t !== "resource") {
                ctx.errorInfraestructura(
                    `No se puede desplegar '${api.nombre}'. Una dependencia no existe.`,
                    "INFRA-004", pos.linea, pos.columna
                );
                return vBool(false);
            }

            if (d.v.estado !== "running") {
                ctx.errorInfraestructura(
                    `No se puede desplegar '${api.nombre}'. ` +
                    `Dependencia '${d.v.nombre}' se encuentra en estado ${d.v.estado}.`,
                    "INFRA-004", pos.linea, pos.columna
                );
                return vBool(false);
            }
        }
    }

    api.asignar("host", vRes(s));
    api.estado = "running";
    ctx.log("OK", `${api.nombre} deployed on ${s.nombre}`, pos.linea, pos.columna);
    return vBool(true);
};

const scale: Nativa = (ctx, args, pos) => {
    aridad("scale", args, 2, pos);
    const api = recurso("scale", args, 0, ["service"], pos);
    const n = args[1];

    if (n.t !== "int") {
        throw new ErrorEjecucion(
            "scale(): el argumento 2 debe ser int.", pos.linea, pos.columna
        );
    }

    api.asignar("replicas", vInt(n.v));
    ctx.log("OK", `${api.nombre} scaled to ${n.v} replicas`, pos.linea, pos.columna);
    return vBool(true);
};

function mismaConexion(a: Recurso, b: Recurso, c: { origen: Recurso; destino: Recurso }): boolean {
    return (c.origen === a && c.destino === b) || (c.origen === b && c.destino === a);
}

const connect: Nativa = (ctx, args, pos) => {
    aridad("connect", args, 2, pos);
    const a = recurso("connect", args, 0, TODOS, pos);
    const b = recurso("connect", args, 1, TODOS, pos);

    ctx.conexiones.push({ origen: a, destino: b });
    ctx.log("OK", `${a.nombre} connected to ${b.nombre}`, pos.linea, pos.columna);
    return vBool(true);
};

const disconnect: Nativa = (ctx, args, pos) => {
    aridad("disconnect", args, 2, pos);
    const a = recurso("disconnect", args, 0, TODOS, pos);
    const b = recurso("disconnect", args, 1, TODOS, pos);

    const idx = ctx.conexiones.findIndex((c) => mismaConexion(a, b, c));

    if (idx < 0) {
        ctx.log("FAIL", `${a.nombre} is not connected to ${b.nombre}`, pos.linea, pos.columna);
        return vBool(false);
    }

    ctx.conexiones.splice(idx, 1);
    ctx.log("OK", `${a.nombre} disconnected from ${b.nombre}`, pos.linea, pos.columna);
    return vBool(true);
};


/* ---------- consulta y salida ---------- */

const print: Nativa = (ctx, args) => {
    ctx.imprimir(args.map(formatear).join(" "));
    return VNULL;
};

const length: Nativa = (_ctx, args, pos) => {
    aridad("length", args, 1, pos);
    const a = args[0];

    if (a.t !== "array") {
        throw new ErrorEjecucion(
            "length(): el argumento debe ser un arreglo.", pos.linea, pos.columna
        );
    }

    return vInt(a.v.length);
};

const status: Nativa = (_ctx, args, pos) => {
    aridad("status", args, 1, pos);
    const r = recurso("status", args, 0, TODOS, pos);
    return vStr(r.estado);
};


export const NATIVAS: Record<string, Nativa> = {
    start, stop, restart, install, uninstall, deploy, scale,
    connect, disconnect, print, length, status
};

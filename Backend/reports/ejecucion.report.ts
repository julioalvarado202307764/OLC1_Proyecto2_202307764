import type { Simbolo } from "../interpreter/environment";
import type { ResultadoEjecucion } from "../interpreter/interpreter";
import type { Recurso } from "../interpreter/infrastructure";
import { formatear } from "../interpreter/values";

import type {
    ReporteBitacora,
    ReporteEstadoFinal,
    ReporteSimbolos
} from "./reportes.types";


/* =========================================================
   TABLA DE SÍMBOLOS
   ========================================================= */

function valorDeSimbolo(s: Simbolo): string {
    if (s.valor === null) {
        return s.detalle ?? "";
    }

    if (s.valor.t === "resource") {
        return s.valor.v.estado;
    }

    return formatear(s.valor);
}

export function generarReporteSimbolos(
    ejecucion: ResultadoEjecucion
): ReporteSimbolos {
    const ordenados = [...ejecucion.simbolos].sort(
        (a, b) => a.linea - b.linea || a.columna - b.columna
    );

    return {
        filas: ordenados.map((s, i) => ({
            numero: i + 1,
            identificador: s.nombre,
            categoria: s.categoria,
            tipo: s.tipo,
            ambito: s.ambito,
            valor: valorDeSimbolo(s),
            linea: s.linea,
            columna: s.columna
        }))
    };
}


/* =========================================================
   ESTADO FINAL DE INFRAESTRUCTURA
   ========================================================= */

function numero(r: Recurso, p: string): number | string | null {
    const v = r.obtener(p);
    return v.t === "int" || v.t === "float" ? v.v : v.t === "null" ? null : formatear(v);
}

function textoProp(r: Recurso, p: string): string {
    const v = r.obtener(p);
    return v.t === "null" ? "" : formatear(v);
}

function conexionesDe(r: Recurso, e: ResultadoEjecucion): string[] {
    return e.conexiones
        .filter((c) => c.origen === r || c.destino === r)
        .map((c) => (c.origen === r ? c.destino.nombre : c.origen.nombre));
}

function dependencias(r: Recurso): string[] {
    const d = r.obtener("dependsOn");
    return d.t === "array" ? d.v.map(formatear) : [];
}

function detalles(r: Recurso, e: ResultadoEjecucion): string {
    const partes: string[] = [];

    if (r.tipo === "server") {
        partes.push(`${textoProp(r, "cpu")} CPU`);
        partes.push(`${textoProp(r, "memory")} GB`);
        partes.push(...r.paquetes());
    } else if (r.tipo === "database") {
        partes.push(`${textoProp(r, "engine")} ${textoProp(r, "version")} :${textoProp(r, "port")}`);
    } else {
        const host = r.obtener("host");
        partes.push(`host=${host.t === "resource" ? host.v.nombre : "none"}`);
        partes.push(`replicas=${textoProp(r, "replicas")}`);
    }

    const conn = conexionesDe(r, e);
    if (conn.length > 0) {
        partes.push(`connected: ${conn.join(", ")}`);
    }

    return partes.filter((p) => p !== "").join(", ");
}

export function generarReporteEstadoFinal(
    ejecucion: ResultadoEjecucion
): ReporteEstadoFinal {
    const servers: Array<Record<string, unknown>> = [];
    const services: Array<Record<string, unknown>> = [];
    const databases: Array<Record<string, unknown>> = [];

    for (const r of ejecucion.recursos) {
        if (r.tipo === "server") {
            servers.push({
                name: r.nombre,
                status: r.estado,
                cpu: numero(r, "cpu"),
                memory: numero(r, "memory"),
                disk: numero(r, "disk"),
                os: textoProp(r, "os"),
                packages: r.paquetes(),
                connections: conexionesDe(r, ejecucion)
            });
        } else if (r.tipo === "service") {
            const host = r.obtener("host");
            services.push({
                name: r.nombre,
                status: r.estado,
                port: numero(r, "port"),
                replicas: numero(r, "replicas"),
                host: host.t === "resource" ? host.v.nombre : null,
                dependsOn: dependencias(r),
                connections: conexionesDe(r, ejecucion)
            });
        } else {
            databases.push({
                name: r.nombre,
                status: r.estado,
                engine: textoProp(r, "engine"),
                version: textoProp(r, "version"),
                port: numero(r, "port"),
                dependsOn: dependencias(r),
                connections: conexionesDe(r, ejecucion)
            });
        }
    }

    return {
        filas: ejecucion.recursos.map((r) => ({
            recurso: r.nombre,
            tipo: r.tipo,
            estado: r.estado,
            detalles: detalles(r, ejecucion)
        })),
        infraestructura: { servers, services, databases }
    };
}


/* =========================================================
   BITÁCORA
   ========================================================= */

export function generarReporteBitacora(
    ejecucion: ResultadoEjecucion
): ReporteBitacora {
    return {
        filas: ejecucion.bitacora.map((b, i) => ({
            numero: i + 1,
            nivel: b.nivel,
            mensaje: b.mensaje,
            linea: b.linea,
            columna: b.columna
        }))
    };
}

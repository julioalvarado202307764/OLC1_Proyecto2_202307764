import { VNULL, vArr, vStr } from "./values";
import type { Valor } from "./values";

/* =========================================================
   RECURSOS DE INFRAESTRUCTURA SIMULADOS
   ========================================================= */

export type TipoRecurso = "server" | "service" | "database";

export class Recurso {
    readonly props = new Map<string, Valor>();

    constructor(
        public readonly nombre: string,
        public readonly tipo: TipoRecurso,
        public readonly linea: number,
        public readonly columna: number
    ) {
        /* Valores iniciales (secciones 9 y 27 del enunciado). */
        this.props.set(
            "status",
            vStr(tipo === "service" ? "undeployed" : "stopped")
        );

        if (tipo === "server") {
            this.props.set("packages", vArr([]));
        }

        if (tipo === "service") {
            this.props.set("host", VNULL);
        }

        if (tipo === "service" || tipo === "database") {
            this.props.set("dependsOn", vArr([]));
        }
    }

    get estado(): string {
        const s = this.props.get("status");
        return s && s.t === "string" ? s.v : "";
    }

    set estado(valor: string) {
        this.props.set("status", vStr(valor));
    }

    obtener(propiedad: string): Valor {
        return this.props.get(propiedad) ?? VNULL;
    }

    asignar(propiedad: string, valor: Valor): void {
        this.props.set(propiedad, valor);
    }

    paquetes(): string[] {
        const p = this.props.get("packages");
        if (!p || p.t !== "array") {
            return [];
        }
        return p.v.filter((e) => e.t === "string").map((e) => (e as { v: string }).v);
    }
}

export interface Conexion {
    origen: Recurso;
    destino: Recurso;
}

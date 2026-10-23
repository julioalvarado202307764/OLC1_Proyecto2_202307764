import type {
    Token,
    ErrorLexico
} from "../analizador/lexer";

import type {
    ErrorSintactico
} from "../analizador/parser";


/* =========================================================
   REPORTE DE TOKENS
   ========================================================= */

export interface ReporteTokens {
    filas: Array<{
        numero: number;
        lexema: Token["lexema"];
        token: Token["tipo"];
        linea: Token["linea"];
        columna: Token["columna"];
    }>;
}


/* =========================================================
   REPORTE DE ERRORES
   ========================================================= */

export type TipoErrorReporte =
    | ErrorLexico["tipo"]
    | ErrorSintactico["tipo"]
    | "Ejecución"
    | "Infraestructura";

export interface ReporteErrores {
    filas: Array<{
        numero: number;
        tipo: TipoErrorReporte;

        /*
         * Solo existen códigos definidos por el enunciado
         * (INFRA-004). El resto de errores no inventa códigos.
         */
        codigo: string | null;

        descripcion: string;
        linea: number;
        columna: number;
    }>;
}


/* =========================================================
   REPORTE DEL AST
   ========================================================= */

export interface ReporteAST {
    nodos: Array<{
        id: string;
        etiqueta: string;
    }>;

    aristas: Array<{
        origen: string;
        destino: string;
    }>;

    /* null cuando no existe AST. */
    dot: string | null;

    /* SVG generado con Viz.js; null cuando no existe AST. */
    svg: string | null;
}


/* =========================================================
   REPORTES DE EJECUCIÓN
   ========================================================= */

export interface ReporteSimbolos {
    filas: Array<{
        numero: number;
        identificador: string;
        categoria: string;
        tipo: string;
        ambito: string;
        valor: string;
        linea: number;
        columna: number;
    }>;
}

export interface ReporteEstadoFinal {
    /* Tabla: Recurso | Tipo | Estado | Detalles (sección 17.5). */
    filas: Array<{
        recurso: string;
        tipo: string;
        estado: string;
        detalles: string;
    }>;

    /* Estructura serializable (sección 24.6). */
    infraestructura: {
        servers: Array<Record<string, unknown>>;
        services: Array<Record<string, unknown>>;
        databases: Array<Record<string, unknown>>;
    };
}

export interface ReporteBitacora {
    filas: Array<{
        numero: number;
        nivel: "OK" | "FAIL" | "ERROR";
        mensaje: string;
        linea: number | null;
        columna: number | null;
    }>;
}


/* =========================================================
   CONTRATO GENERAL DE REPORTES
   ========================================================= */

export interface ResultadoReportes {
    tablaTokens: ReporteTokens;
    errores: ReporteErrores;
    ast: ReporteAST;

    /* Presentes únicamente cuando el programa fue ejecutado. */
    tablaSimbolos?: ReporteSimbolos;
    estadoFinal?: ReporteEstadoFinal;
    bitacora?: ReporteBitacora;
}

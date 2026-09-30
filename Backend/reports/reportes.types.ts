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

export interface ReporteErrores {
    filas: Array<{
        numero: number;

        tipo:
            | ErrorLexico["tipo"]
            | ErrorSintactico["tipo"];

        /*
         * El PDF contempla una columna "Código",
         * pero nuestro análisis léxico/sintáctico actual
         * no produce códigos de error oficiales.
         *
         * No inventaremos LEX-xxx ni SYN-xxx.
         */
        codigo: null;

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

    /*
     * Se completará en el Paso 4.
     * null representa que no existe una representación
     * disponible, por ejemplo cuando ast === null.
     */
    dot: string | null;

    /*
     * Se completará en el Paso 5.
     * Todavía NO renderizamos nada.
     */
    svg: string | null;
}


/* =========================================================
   CONTRATO GENERAL DE REPORTES
   ========================================================= */

export interface ResultadoReportes {
    tablaTokens: ReporteTokens;
    errores: ReporteErrores;
    ast: ReporteAST;
}
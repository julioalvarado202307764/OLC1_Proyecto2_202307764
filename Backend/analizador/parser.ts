import type { Token, ErrorLexico } from "./lexer";
import type { ProgramNode } from "../models/ast";

const moduloGenerado = require("./analizador.js");
const parser = moduloGenerado.parser ?? moduloGenerado;


/* =========================================================
   CONTRATO PÚBLICO DEL ANALIZADOR
   ========================================================= */

export interface ErrorSintactico {
    tipo: "Sintáctico";
    descripcion: string;
    lexema: string;
    linea: number;
    columna: number;
}

export interface ResultadoAnalisis {
    ast: ProgramNode | null;
    tokens: Token[];
    erroresLexicos: ErrorLexico[];
    erroresSintacticos: ErrorSintactico[];
}


/* =========================================================
   TIPOS INTERNOS PARA JISON
   ========================================================= */

interface UbicacionJison {
    first_line?: number;
    first_column?: number;
}

interface ErrorJison {
    text?: string;
    line?: number;
    loc?: UbicacionJison;
    expected?: string[];
    recoverable?: boolean;
}

interface ContextoAnalisis {
    tokens: Token[];
    erroresLexicos: ErrorLexico[];
    erroresSintacticos: ErrorSintactico[];

    inicioComentario: unknown;

    registrarErrorSintacticoManual?: (
        descripcion: string,
        ubicacion: UbicacionJison
    ) => void;

    parseError?: (
        mensaje: string,
        hash: ErrorJison
    ) => void;
}


/* =========================================================
   ANALIZADOR
   ========================================================= */

export function analizarCodigo(codigo: string): ResultadoAnalisis {
    const contexto: ContextoAnalisis = {
        tokens: [],
        erroresLexicos: [],
        erroresSintacticos: [],
        inicioComentario: null
    };


    contexto.registrarErrorSintacticoManual = (
        descripcion: string,
        ubicacion: UbicacionJison
    ) => {
        contexto.erroresSintacticos.push({
            tipo: "Sintáctico",
            descripcion,
            lexema: "",
            linea: ubicacion?.first_line ?? 1,
            columna: (ubicacion?.first_column ?? 0) + 1
        });
    };


    contexto.parseError = (
        mensaje: string,
        hash: ErrorJison
    ) => {
        const ultimoToken =
            contexto.tokens.length > 0
                ? contexto.tokens[contexto.tokens.length - 1]
                : null;

        const linea =
            ultimoToken?.linea ??
            hash?.loc?.first_line ??
            ((hash?.line ?? 0) + 1);

        const columna =
            ultimoToken?.columna ??
            ((hash?.loc?.first_column ?? 0) + 1);

        const lexema =
            hash?.text && hash.text.length > 0
                ? hash.text
                : "EOF";

        const esperados = Array.isArray(hash?.expected)
            ? hash.expected.join(", ")
            : "";

        const descripcion = esperados
            ? `Token inesperado '${lexema}'. Se esperaba: ${esperados}.`
            : `Token inesperado '${lexema}'.`;

        contexto.erroresSintacticos.push({
            tipo: "Sintáctico",
            descripcion,
            lexema,
            linea,
            columna
        });

        /*
         * Si Jison dispone de una producción de recuperación,
         * permitimos que continúe con el análisis.
         */
        if (hash?.recoverable) {
            return;
        }

        /*
         * Los errores sintácticos irrecuperables también quedan
         * registrados, pero detienen el parseo.
         */
        const error = new Error(mensaje) as Error & {
            esErrorSintactico?: boolean;
        };

        error.esErrorSintactico = true;

        throw error;
    };


    parser.yy = contexto;

    let ast: ProgramNode | null = null;

    try {
        ast = parser.parse(codigo) as ProgramNode;
    } catch (error: unknown) {
        const errorParser = error as Error & {
            esErrorSintactico?: boolean;
        };

        /*
         * Jison puede abortar una recuperación ya iniciada
         * cuando no encuentra otro punto válido de
         * sincronización antes de finalizar la entrada.
         *
         * Solo tratamos ese caso concreto como parte del
         * análisis si ya existe al menos un error sintáctico
         * registrado por parseError.
         *
         * No se agrega ningún error nuevo aquí.
         */
        const esAbortoRecuperacionJison =
            error instanceof Error &&
            error.message ===
            "Parsing halted while starting to recover from another error.";

        const recuperacionSintacticaYaRegistrada =
            contexto.erroresSintacticos.length > 0;

        if (
            !errorParser?.esErrorSintactico &&
            !(
                esAbortoRecuperacionJison &&
                recuperacionSintacticaYaRegistrada
            )
        ) {
            throw error;
        }
    }

    return {
        ast,
        tokens: contexto.tokens,
        erroresLexicos: contexto.erroresLexicos,
        erroresSintacticos: contexto.erroresSintacticos
    };
}
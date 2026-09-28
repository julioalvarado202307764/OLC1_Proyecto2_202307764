interface Token {
    lexema: string;
    tipo: string;
    linea: number;
    columna: number;
    valorProcesado?: string;
}

interface ErrorLexico {
    tipo: "Léxico";
    descripcion: string;
    lexema?: string;
    linea: number;
    columna: number;
}

interface ResultadoLexico {
    tokens: Token[];
    errores: ErrorLexico[];
}

interface ContextoLexer {
    tokens: Token[];
    erroresLexicos: ErrorLexico[];
    inicioComentario: {
        linea: number;
        columna: number;
    } | null;
}

// analizador.js es generado automáticamente por Jison.
// No debe editarse manualmente.
const moduloGenerado = require("./analizador.js");

/*
 * Dependiendo de cómo Jison genere el módulo CommonJS,
 * el parser puede venir exportado como `.parser`.
 */
const parserGenerado = moduloGenerado.parser ?? moduloGenerado;

/**
 * Ejecuta únicamente el análisis léxico sobre código AutoInfra.
 *
 * En esta fase NO se ejecuta el parser sintáctico.
 */
export function analizarLexicamente(codigo: string): ResultadoLexico {
    if (typeof codigo !== "string") {
        throw new TypeError("El código a analizar debe ser una cadena.");
    }

    if (!parserGenerado || !parserGenerado.lexer) {
        throw new Error(
            "No se pudo encontrar el lexer generado por Jison en analizador.js."
        );
    }

    /*
     * Creamos una instancia independiente del lexer para que una ejecución
     * no conserve estado de una ejecución anterior.
     */
    const lexer = Object.create(parserGenerado.lexer);

    const contexto: ContextoLexer = {
        tokens: [],
        erroresLexicos: [],
        inicioComentario: null
    };

    /*
     * setInput recibe:
     *
     * 1. El código fuente.
     * 2. El objeto `yy`, utilizado dentro de analizador.jison.
     *
     * Así, cuando la gramática utiliza:
     *
     * yy.tokens
     * yy.erroresLexicos
     *
     * está modificando exactamente este objeto.
     */
    lexer.setInput(codigo, contexto);

    /*
     * Ejecutamos directamente lexer.lex().
     *
     * NO llamamos parser.parse(), porque todavía no queremos
     * ejecutar análisis sintáctico.
     */
    while (true) {
        const token = lexer.lex();

        /*
         * Nuestra regla <<EOF>> retorna "EOF".
         *
         * También contemplamos 1 porque algunas versiones/configuraciones
         * de Jison pueden representar EOF internamente con ese valor.
         */
        if (token === "EOF" || token === 1) {
            break;
        }

        /*
         * Las reglas de espacios, comentarios y errores recuperables
         * no retornan token.
         *
         * El propio lexer continúa internamente hasta encontrar
         * un token válido o EOF.
         */
    }

    return {
        tokens: contexto.tokens,
        errores: contexto.erroresLexicos
    };
}

export type {
    Token,
    ErrorLexico,
    ResultadoLexico
};
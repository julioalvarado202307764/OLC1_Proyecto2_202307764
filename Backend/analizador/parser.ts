const moduloGenerado = require("./analizador.js");

const parser = moduloGenerado.parser ?? moduloGenerado;

export interface ErrorSintactico {
    tipo: "Sintáctico";
    descripcion: string;
    lexema: string;
    linea: number;
    columna: number;
}

export interface ResultadoParser {
    ast: any | null;
    tokens: any[];
    erroresLexicos: any[];
    erroresSintacticos: ErrorSintactico[];
}

export function analizarCodigo(codigo: string): ResultadoParser {
    const contexto: any = {
        tokens: [],
        erroresLexicos: [],
        erroresSintacticos: [],
        inicioComentario: null
    };

    contexto.registrarErrorSintacticoManual = (
        descripcion: string,
        ubicacion: any
    ) => {
        contexto.erroresSintacticos.push({
            tipo: "Sintáctico",
            descripcion,
            lexema: "",
            linea: ubicacion?.first_line ?? 1,
            columna: (ubicacion?.first_column ?? 0) + 1
        });
    };

    contexto.parseError = (mensaje: string, hash: any) => {
        const linea =
            hash?.loc?.first_line ??
            ((hash?.line ?? 0) + 1);

        const columna =
            (hash?.loc?.first_column ?? 0) + 1;

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
         * Si hay una producción "error" utilizable,
         * Jison intentará recuperarse automáticamente.
         */
        if (hash?.recoverable) {
            return;
        }

        /*
         * Solo los errores sintácticos irrecuperables
         * son capturados después.
         */
        const error = new Error(mensaje);
        (error as any).esErrorSintactico = true;

        throw error;
    };

    parser.yy = contexto;

    let ast: any | null = null;

    try {
        ast = parser.parse(codigo);
    } catch (error) {
        /*
         * Si fue un error sintáctico ya registrado,
         * devolvemos el resultado parcial/null.
         *
         * Si fue un bug real del parser, NO lo ocultamos.
         */
        if (!(error as any)?.esErrorSintactico) {
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
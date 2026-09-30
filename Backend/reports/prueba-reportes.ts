import type {
    ResultadoReportes
} from "./reportes.types";


const prueba: ResultadoReportes = {
    tablaTokens: {
        filas: [
            {
                numero: 1,
                lexema: "main",
                token: "MAIN",
                linea: 1,
                columna: 1
            }
        ]
    },

    errores: {
        filas: [
            {
                numero: 1,
                tipo: "Sintáctico",
                codigo: null,
                descripcion: "Ejemplo de error sintáctico",
                linea: 2,
                columna: 5
            }
        ]
    },

    ast: {
        nodos: [
            {
                id: "n0",
                etiqueta: "Program"
            }
        ],

        aristas: [],

        dot: null,
        svg: null
    }
};


console.log(
    JSON.stringify(prueba, null, 2)
);
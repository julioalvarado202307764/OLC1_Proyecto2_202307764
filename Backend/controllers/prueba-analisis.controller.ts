import { Request, Response } from "express";
import { analizar } from "./analisis.controller";


function crearResponseMock() {
    const respuesta: {
        statusCode: number;
        body: unknown;
        status: (codigo: number) => typeof respuesta;
        json: (body: unknown) => typeof respuesta;
    } = {
        statusCode: 200,
        body: null,

        status(codigo: number) {
            this.statusCode = codigo;
            return this;
        },

        json(body: unknown) {
            this.body = body;
            return this;
        }
    };

    return respuesta;
}


/* =========================================================
   PRUEBA 1 — CÓDIGO VÁLIDO
   ========================================================= */

const reqValido = {
    body: {
        codigo: `main {
            print("hola");
        }`
    }
} as Request;

const resValido = crearResponseMock();

analizar(
    reqValido,
    resValido as unknown as Response
);

console.log("=== REQUEST VÁLIDO ===");
console.log("Status:", resValido.statusCode);
console.log(
    JSON.stringify(resValido.body, null, 2)
);


/* =========================================================
   PRUEBA 2 — CÓDIGO CON ERROR SINTÁCTICO
   ========================================================= */

const reqConError = {
    body: {
        codigo: `main {
            int x = ;
            print("continua");
        }`
    }
} as Request;

const resConError = crearResponseMock();

analizar(
    reqConError,
    resConError as unknown as Response
);

console.log("\n=== REQUEST CON ERROR SINTÁCTICO ===");
console.log("Status:", resConError.statusCode);
console.log(
    JSON.stringify(resConError.body, null, 2)
);


/* =========================================================
   PRUEBA 3 — REQUEST INVÁLIDO
   ========================================================= */

const reqInvalido = {
    body: {}
} as Request;

const resInvalido = crearResponseMock();

analizar(
    reqInvalido,
    resInvalido as unknown as Response
);

console.log("\n=== REQUEST SIN CÓDIGO ===");
console.log("Status:", resInvalido.statusCode);
console.log(
    JSON.stringify(resInvalido.body, null, 2)
);
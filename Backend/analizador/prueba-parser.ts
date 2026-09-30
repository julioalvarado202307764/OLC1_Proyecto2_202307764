import {
    analizarCodigo,
    ResultadoAnalisis
} from "./parser";


const codigoValido = `main {
    print("hola");
}`;

const resultadoValido: ResultadoAnalisis =
    analizarCodigo(codigoValido);

console.log("=== CÓDIGO VÁLIDO ===");

console.log("AST:", resultadoValido.ast?.type);
console.log("Tokens:", resultadoValido.tokens.length);
console.log(
    "Errores léxicos:",
    resultadoValido.erroresLexicos.length
);
console.log(
    "Errores sintácticos:",
    resultadoValido.erroresSintacticos.length
);


const codigoConError = `main {
    int x = ;
    print("continua");
}`;

const resultadoConError: ResultadoAnalisis =
    analizarCodigo(codigoConError);

console.log("\n=== CÓDIGO CON ERROR ===");

console.log("AST:", resultadoConError.ast?.type);
console.log("Tokens:", resultadoConError.tokens.length);
console.log(
    "Errores léxicos:",
    resultadoConError.erroresLexicos.length
);
console.log(
    "Errores sintácticos:",
    resultadoConError.erroresSintacticos.length
);
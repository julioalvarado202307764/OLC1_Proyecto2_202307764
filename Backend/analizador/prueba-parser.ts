import { analizarCodigo } from "./parser";

const codigo = `main {
    int x = ;
    print("continua");

    int y = ;
    print("termino");
}`;

const resultado = analizarCodigo(codigo);

console.log("AST:");
console.log(JSON.stringify(resultado.ast, null, 2));

console.log("\nERRORES SINTÁCTICOS:");
console.log(JSON.stringify(resultado.erroresSintacticos, null, 2));

console.log("\nERRORES LÉXICOS:");
console.log(JSON.stringify(resultado.erroresLexicos, null, 2));
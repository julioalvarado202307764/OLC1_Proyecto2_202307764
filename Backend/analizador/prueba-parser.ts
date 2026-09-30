import { analizarCodigo } from "./parser";

const codigo = `int brokenA = 10

server backend {
    cpu = 4;
    memory = 16;
}

string brokenB = "production"

task validTask {
    print("task valida");
}

main {
    run validTask;
}`;

const resultado = analizarCodigo(codigo);

console.log("AST:");
console.log(JSON.stringify(resultado.ast, null, 2));

console.log("\nERRORES SINTÁCTICOS:");
console.log(JSON.stringify(resultado.erroresSintacticos, null, 2));

console.log("\nERRORES LÉXICOS:");
console.log(JSON.stringify(resultado.erroresLexicos, null, 2));
const moduloGenerado = require("./analizador.js");

const parser = moduloGenerado.parser ?? moduloGenerado;

const codigo = `{
    for (int i = 0; i < 5; i = i + 1) {
        if (i == 1) {
            continue;
        }

        if (i == 3) {
            break;
        }

        print(i);
    }

    return 42;
}`;

parser.yy = {
    tokens: [],
    erroresLexicos: [],
    inicioComentario: null
};

const ast = parser.parse(codigo);

console.log(JSON.stringify(ast, null, 2));
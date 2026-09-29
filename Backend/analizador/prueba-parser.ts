const moduloGenerado = require("./analizador.js");

const parser = moduloGenerado.parser ?? moduloGenerado;

const codigo = `{
    if (backend.memory >= 8 && activo) {
        start(backend);
    } else {
        stop(backend);
    }
}`;

parser.yy = {
    tokens: [],
    erroresLexicos: [],
    inicioComentario: null
};

const ast = parser.parse(codigo);

console.log(JSON.stringify(ast, null, 2));
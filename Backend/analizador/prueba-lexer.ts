import { analizarLexicamente } from "./lexer";

const codigo = `int float string bool server service database
if else while for break continue return
function task main run true false

backend Backend _backend2 apiProduccion

10 2.5 0.75 -25

a = b + c - d * e / f % g;
a == b != c >= d <= e > f < g;
a && b || !c;

funcion(a, b);
obj.propiedad;
arreglo[0];

{ } ( ) [ ] ; , .

// comentario de una línea

/* comentario
   multilínea */

string texto = "hola";`;

const resultado = analizarLexicamente(codigo);

console.log(JSON.stringify(resultado, null, 2));
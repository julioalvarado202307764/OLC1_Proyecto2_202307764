import { analizarCodigo } from "../analizador/parser";
import { generarReporteTokens } from "./tokens.report";


const codigo = `main {
    int x = 10;
    print(x);
}`;

const resultado = analizarCodigo(codigo);

const reporte = generarReporteTokens(resultado);

console.log(
    JSON.stringify(reporte, null, 2)
);
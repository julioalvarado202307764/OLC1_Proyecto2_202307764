import { analizarCodigo } from "../analizador/parser";
import { generarReporteErrores } from "./errores.report";


const codigo = `main {
    int x = ;
    @
    print("continua");

    int y = ;
    #
    print("termino");
}`;

const resultado = analizarCodigo(codigo);

const reporte = generarReporteErrores(resultado);

console.log(
    JSON.stringify(reporte, null, 2)
);
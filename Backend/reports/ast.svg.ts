import { instance } from "@viz-js/viz";

import type {
    ReporteAST
} from "./reportes.types";


/*
 * Viz.js utiliza WebAssembly y su inicialización es asíncrona.
 *
 * Conservamos la Promise para reutilizar la misma instancia
 * en posteriores renderizados.
 */
let instanciaViz:
    ReturnType<typeof instance> | null = null;


function obtenerViz() {
    if (instanciaViz === null) {
        instanciaViz = instance();
    }

    return instanciaViz;
}


/* =========================================================
   RENDER SVG DEL AST
   ========================================================= */

export async function renderizarReporteAST(
    reporte: ReporteAST
): Promise<ReporteAST> {
    /*
     * Si no existe AST/DOT, tampoco existe gráfico que renderizar.
     */
    if (reporte.dot === null) {
        return {
            ...reporte,
            svg: null
        };
    }

    const viz = await obtenerViz();

    const svg = viz.renderString(
        reporte.dot,
        {
            format: "svg",
            engine: "dot"
        }
    );

    return {
        ...reporte,
        svg
    };
}
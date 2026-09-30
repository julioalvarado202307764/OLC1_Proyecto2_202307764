import type {
    ResultadoAnalisis
} from "../analizador/parser";

import type {
    ReporteAST
} from "./reportes.types";


/* =========================================================
   TIPOS INTERNOS
   ========================================================= */

interface NodoASTGenerico {
    type: string;
    [clave: string]: unknown;
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function esNodoAST(
    valor: unknown
): valor is NodoASTGenerico {
    return (
        typeof valor === "object" &&
        valor !== null &&
        "type" in valor &&
        typeof (valor as { type?: unknown }).type === "string"
    );
}


function obtenerTipoAutoInfra(
    valor: unknown
): string | null {
    if (
        typeof valor !== "object" ||
        valor === null
    ) {
        return null;
    }

    const tipo = valor as {
        name?: unknown;
        isArray?: unknown;
    };

    if (
        typeof tipo.name !== "string" ||
        typeof tipo.isArray !== "boolean"
    ) {
        return null;
    }

    return tipo.isArray
        ? `${tipo.name}[]`
        : tipo.name;
}


function obtenerTexto(
    valor: unknown
): string | null {
    return typeof valor === "string"
        ? valor
        : null;
}


/* =========================================================
   ETIQUETAS DEL AST
   ========================================================= */

function obtenerEtiqueta(
    nodo: NodoASTGenerico
): string {
    switch (nodo.type) {
        case "LiteralExpression": {
            const literalType =
                obtenerTexto(nodo.literalType);

            const raw =
                obtenerTexto(nodo.raw);

            if (literalType && raw !== null) {
                return `${nodo.type}\n${literalType}: ${raw}`;
            }

            return nodo.type;
        }


        case "IdentifierExpression": {
            const name = obtenerTexto(nodo.name);

            return name
                ? `${nodo.type}\n${name}`
                : nodo.type;
        }


        case "BinaryExpression":
        case "UnaryExpression": {
            const operator =
                obtenerTexto(nodo.operator);

            return operator
                ? `${nodo.type}\n${operator}`
                : nodo.type;
        }


        case "PropertyAccessExpression": {
            const property =
                obtenerTexto(nodo.property);

            return property
                ? `${nodo.type}\n.${property}`
                : nodo.type;
        }


        case "VariableDeclaration": {
            const name =
                obtenerTexto(nodo.name);

            const variableType =
                obtenerTipoAutoInfra(
                    nodo.variableType
                );

            if (name && variableType) {
                return `${nodo.type}\n${variableType} ${name}`;
            }

            return nodo.type;
        }


        case "Parameter": {
            const name =
                obtenerTexto(nodo.name);

            const parameterType =
                obtenerTipoAutoInfra(
                    nodo.parameterType
                );

            if (name && parameterType) {
                return `${nodo.type}\n${parameterType} ${name}`;
            }

            return nodo.type;
        }


        case "FunctionDeclaration": {
            const name =
                obtenerTexto(nodo.name);

            const returnType =
                obtenerTipoAutoInfra(
                    nodo.returnType
                );

            if (name && returnType) {
                return `${nodo.type}\n${name} -> ${returnType}`;
            }

            return nodo.type;
        }


        case "TaskDeclaration": {
            const name =
                obtenerTexto(nodo.name);

            return name
                ? `${nodo.type}\n${name}`
                : nodo.type;
        }


        case "ResourceDeclaration": {
            const name =
                obtenerTexto(nodo.name);

            const resourceType =
                obtenerTexto(nodo.resourceType);

            if (name && resourceType) {
                return `${nodo.type}\n${resourceType} ${name}`;
            }

            return nodo.type;
        }


        case "ResourceProperty": {
            const name =
                obtenerTexto(nodo.name);

            return name
                ? `${nodo.type}\n${name}`
                : nodo.type;
        }


        case "RunInstruction": {
            const taskName =
                obtenerTexto(nodo.taskName);

            return taskName
                ? `${nodo.type}\n${taskName}`
                : nodo.type;
        }


        default:
            return nodo.type;
    }
}


/* =========================================================
   DOT
   ========================================================= */

function escaparDOT(
    texto: string
): string {
    return texto
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n");
}


function generarDOT(
    nodos: ReporteAST["nodos"],
    aristas: ReporteAST["aristas"]
): string {
    const lineas: string[] = [
        "digraph AST {",
        '    node [shape="box"];'
    ];

    for (const nodo of nodos) {
        lineas.push(
            `    ${nodo.id} [label="${escaparDOT(nodo.etiqueta)}"];`
        );
    }

    for (const arista of aristas) {
        lineas.push(
            `    ${arista.origen} -> ${arista.destino};`
        );
    }

    lineas.push("}");

    return lineas.join("\n");
}


/* =========================================================
   GENERADOR DEL REPORTE AST
   ========================================================= */

export function generarReporteAST(
    resultado: ResultadoAnalisis
): ReporteAST {
    if (resultado.ast === null) {
        return {
            nodos: [],
            aristas: [],
            dot: null,
            svg: null
        };
    }

    const nodos: ReporteAST["nodos"] = [];
    const aristas: ReporteAST["aristas"] = [];

    let correlativo = 0;


    function recorrer(
        nodo: NodoASTGenerico,
        padreId: string | null = null
    ): void {
        const id = `n${correlativo++}`;

        nodos.push({
            id,
            etiqueta: obtenerEtiqueta(nodo)
        });

        if (padreId !== null) {
            aristas.push({
                origen: padreId,
                destino: id
            });
        }

        for (const [clave, valor] of Object.entries(nodo)) {
            if (clave === "type") {
                continue;
            }

            if (esNodoAST(valor)) {
                recorrer(valor, id);
                continue;
            }

            if (Array.isArray(valor)) {
                for (const elemento of valor) {
                    if (esNodoAST(elemento)) {
                        recorrer(elemento, id);
                    }
                }
            }
        }
    }


    recorrer(
        resultado.ast as unknown as NodoASTGenerico
    );


    return {
        nodos,
        aristas,
        dot: generarDOT(
            nodos,
            aristas
        ),
        svg: null
    };
}
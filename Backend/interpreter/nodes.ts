import { Entorno } from "./environment";
import { ErrorEjecucion } from "./errors";
import { NATIVAS } from "./natives";
import { Recurso } from "./infrastructure";
import type { TipoRecurso } from "./infrastructure";
import {
    VNULL, aBool, coaccionar, esNumero, formatear, igualdad, nombreTipo,
    valorPorDefecto, vArr, vBool, vFloat, vInt, vRes, vStr
} from "./values";
import type { TipoDeclarado, Valor } from "./values";

/* =========================================================
   PATRÓN INTERPRETER

   Cada construcción ejecutable del lenguaje es un objeto con
   su propio método:
     - Expresion.evaluate(env)    -> Valor
     - Instruccion.execute(env)   -> Senal

   El control de flujo (break / continue / return) se propaga con
   señales, sin utilizar excepciones.
   ========================================================= */

export type TipoSenal = "normal" | "break" | "continue" | "return";

export interface Senal {
    tipo: TipoSenal;
    valor?: Valor;
}

export const NORMAL: Senal = Object.freeze({ tipo: "normal" }) as Senal;
const BREAK: Senal = Object.freeze({ tipo: "break" }) as Senal;
const CONTINUE: Senal = Object.freeze({ tipo: "continue" }) as Senal;

export abstract class Nodo {
    constructor(
        public readonly linea: number,
        public readonly columna: number
    ) { }

    protected error(mensaje: string): ErrorEjecucion {
        return new ErrorEjecucion(mensaje, this.linea, this.columna);
    }
}

export abstract class Expresion extends Nodo {
    abstract evaluate(env: Entorno): Valor;
}

export abstract class Instruccion extends Nodo {
    abstract execute(env: Entorno): Senal;
}


/* =========================================================
   EXPRESIONES
   ========================================================= */

export class Literal extends Expresion {
    constructor(l: number, c: number, private readonly valor: Valor) {
        super(l, c);
    }

    evaluate(): Valor {
        return this.valor;
    }
}

export class Identificador extends Expresion {
    constructor(l: number, c: number, public readonly nombre: string) {
        super(l, c);
    }

    evaluate(env: Entorno): Valor {
        const s = env.buscar(this.nombre);

        if (s === null) {
            throw this.error(`Identificador '${this.nombre}' no definido en el entorno.`);
        }

        if (s.categoria === "función" || s.categoria === "task") {
            throw this.error(`'${this.nombre}' es una ${s.categoria} y no puede usarse como valor.`);
        }

        return s.valor ?? VNULL;
    }
}

export class ArregloLiteral extends Expresion {
    constructor(l: number, c: number, private readonly elementos: Expresion[]) {
        super(l, c);
    }

    evaluate(env: Entorno): Valor {
        return vArr(this.elementos.map((e) => e.evaluate(env)));
    }
}

export class Unaria extends Expresion {
    constructor(
        l: number, c: number,
        private readonly operador: string,
        private readonly operando: Expresion
    ) {
        super(l, c);
    }

    evaluate(env: Entorno): Valor {
        const v = this.operando.evaluate(env);

        if (this.operador === "!") {
            return vBool(!aBool(v));
        }

        if (v.t === "int") {
            return vInt(-v.v);
        }

        if (v.t === "float") {
            return vFloat(-v.v);
        }

        throw this.error("El operador '-' unario requiere un operando numérico.");
    }
}

export class Binaria extends Expresion {
    constructor(
        l: number, c: number,
        private readonly operador: string,
        private readonly izq: Expresion,
        private readonly der: Expresion
    ) {
        super(l, c);
    }

    evaluate(env: Entorno): Valor {
        /* Corto circuito: la expresión derecha solo se evalúa si es necesaria. */
        if (this.operador === "&&") {
            const a = this.izq.evaluate(env);
            return aBool(a) ? vBool(aBool(this.der.evaluate(env))) : vBool(false);
        }

        if (this.operador === "||") {
            const a = this.izq.evaluate(env);
            return aBool(a) ? vBool(true) : vBool(aBool(this.der.evaluate(env)));
        }

        const a = this.izq.evaluate(env);
        const b = this.der.evaluate(env);

        switch (this.operador) {
            case "==":
                return vBool(igualdad(a, b));
            case "!=":
                return vBool(!igualdad(a, b));
            case "<":
            case "<=":
            case ">":
            case ">=":
                return this.relacional(a, b);
            default:
                return this.aritmetica(a, b);
        }
    }

    private relacional(a: Valor, b: Valor): Valor {
        if (!esNumero(a) || !esNumero(b)) {
            throw this.error(`El operador '${this.operador}' requiere operandos numéricos.`);
        }

        switch (this.operador) {
            case "<":
                return vBool(a.v < b.v);
            case "<=":
                return vBool(a.v <= b.v);
            case ">":
                return vBool(a.v > b.v);
            default:
                return vBool(a.v >= b.v);
        }
    }

    private aritmetica(a: Valor, b: Valor): Valor {
        /* Concatenación: string + cualquier valor. */
        if (this.operador === "+" && (a.t === "string" || b.t === "string")) {
            return vStr(formatear(a) + formatear(b));
        }

        if (!esNumero(a) || !esNumero(b)) {
            throw this.error(`Operandos inválidos para el operador '${this.operador}'.`);
        }

        const real = a.t === "float" || b.t === "float";
        const num = (n: number): Valor => (real ? vFloat(n) : vInt(n));

        switch (this.operador) {
            case "+":
                return num(a.v + b.v);
            case "-":
                return num(a.v - b.v);
            case "*":
                return num(a.v * b.v);
            case "/":
                return vFloat(a.v / b.v);
            case "%":
                return num(a.v % b.v);
            default:
                throw this.error(`Operador '${this.operador}' desconocido.`);
        }
    }
}

export class AccesoPropiedad extends Expresion {
    constructor(
        l: number, c: number,
        private readonly objeto: Expresion,
        private readonly propiedad: string
    ) {
        super(l, c);
    }

    evaluate(env: Entorno): Valor {
        const o = this.objeto.evaluate(env);

        if (o.t !== "resource") {
            throw this.error(`No se puede acceder a la propiedad '${this.propiedad}' de un valor que no es un recurso.`);
        }

        return o.v.obtener(this.propiedad);
    }

    asignar(env: Entorno, valor: Valor): void {
        const o = this.objeto.evaluate(env);

        if (o.t !== "resource") {
            throw this.error(`No se puede asignar la propiedad '${this.propiedad}' de un valor que no es un recurso.`);
        }

        o.v.asignar(this.propiedad, valor);
    }
}

export class AccesoIndice extends Expresion {
    constructor(
        l: number, c: number,
        private readonly objeto: Expresion,
        private readonly indice: Expresion
    ) {
        super(l, c);
    }

    private resolver(env: Entorno): { arreglo: Valor[]; i: number } {
        const o = this.objeto.evaluate(env);
        const idx = this.indice.evaluate(env);

        if (o.t !== "array") {
            throw this.error("El operador [] solo puede aplicarse a un arreglo.");
        }

        if (idx.t !== "int") {
            throw this.error("El índice de un arreglo debe ser int.");
        }

        if (idx.v < 0 || idx.v >= o.v.length) {
            throw this.error(`Índice ${idx.v} fuera de rango (tamaño ${o.v.length}).`);
        }

        return { arreglo: o.v, i: idx.v };
    }

    evaluate(env: Entorno): Valor {
        const { arreglo, i } = this.resolver(env);
        return arreglo[i];
    }

    asignar(env: Entorno, valor: Valor): void {
        const { arreglo, i } = this.resolver(env);
        arreglo[i] = valor;
    }
}

export class Llamada extends Expresion {
    constructor(
        l: number, c: number,
        private readonly nombre: string | null,
        private readonly argumentos: Expresion[]
    ) {
        super(l, c);
    }

    evaluate(env: Entorno): Valor {
        if (this.nombre === null) {
            throw this.error("Solo pueden invocarse funciones por su nombre.");
        }

        const args = this.argumentos.map((a) => a.evaluate(env));
        const ctx = env.ctx;

        const usuario = ctx.funciones.get(this.nombre);

        if (usuario) {
            return usuario.invocar(env, args);
        }

        const nativa = NATIVAS[this.nombre];

        if (nativa) {
            return nativa(ctx, args, { linea: this.linea, columna: this.columna });
        }

        throw this.error(`Función '${this.nombre}' no definida.`);
    }
}


/* =========================================================
   INSTRUCCIONES
   ========================================================= */

export class Bloque extends Instruccion {
    constructor(l: number, c: number, private readonly instrucciones: Instruccion[]) {
        super(l, c);
    }

    /** Ejecuta las instrucciones dentro del entorno recibido. */
    execute(env: Entorno): Senal {
        for (const instruccion of this.instrucciones) {
            const senal = instruccion.execute(env);

            if (senal.tipo !== "normal") {
                return senal;
            }
        }

        return NORMAL;
    }
}

export class DeclaracionVariable extends Instruccion {
    constructor(
        l: number, c: number,
        private readonly nombre: string,
        private readonly tipo: TipoDeclarado,
        private readonly inicial: Expresion | null,
        private readonly categoria: "variable" | "parámetro" = "variable"
    ) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        const valor = this.inicial === null
            ? valorPorDefecto(this.tipo)
            : coaccionar(this.inicial.evaluate(env), this.tipo);

        env.declarar({
            nombre: this.nombre,
            categoria: this.categoria,
            tipo: nombreTipo(this.tipo),
            valor,
            tipoDeclarado: this.tipo,
            linea: this.linea,
            columna: this.columna
        });

        return NORMAL;
    }
}

export class Asignacion extends Instruccion {
    constructor(
        l: number, c: number,
        private readonly objetivo: Expresion,
        private readonly valor: Expresion
    ) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        const v = this.valor.evaluate(env);

        if (this.objetivo instanceof Identificador) {
            const s = env.buscar(this.objetivo.nombre);

            if (s === null || s.categoria === "función" || s.categoria === "task") {
                throw this.error(`Identificador '${this.objetivo.nombre}' no definido en el entorno.`);
            }

            s.valor = coaccionar(v, s.tipoDeclarado);
            return NORMAL;
        }

        if (this.objetivo instanceof AccesoPropiedad || this.objetivo instanceof AccesoIndice) {
            this.objetivo.asignar(env, v);
            return NORMAL;
        }

        throw this.error("Objetivo de asignación inválido.");
    }
}

export class InstruccionExpresion extends Instruccion {
    constructor(l: number, c: number, private readonly expresion: Expresion) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        this.expresion.evaluate(env);
        return NORMAL;
    }
}

export class Si extends Instruccion {
    constructor(
        l: number, c: number,
        private readonly condicion: Expresion,
        private readonly entonces: Bloque,
        private readonly sino: Bloque | Si | null
    ) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        if (aBool(this.condicion.evaluate(env))) {
            return this.entonces.execute(env.hijo("if"));
        }

        if (this.sino instanceof Si) {
            return this.sino.execute(env);
        }

        if (this.sino !== null) {
            return this.sino.execute(env.hijo("else"));
        }

        return NORMAL;
    }
}

export class Mientras extends Instruccion {
    constructor(
        l: number, c: number,
        private readonly condicion: Expresion,
        private readonly cuerpo: Bloque
    ) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        while (aBool(this.condicion.evaluate(env))) {
            const senal = this.cuerpo.execute(env.hijo("while"));

            if (senal.tipo === "break") {
                break;
            }

            if (senal.tipo === "return") {
                return senal;
            }
            /* "continue" y "normal": siguiente iteración. */
        }

        return NORMAL;
    }
}

export class Para extends Instruccion {
    constructor(
        l: number, c: number,
        private readonly inicio: Instruccion,
        private readonly condicion: Expresion,
        private readonly cambio: Instruccion,
        private readonly cuerpo: Bloque
    ) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        const entornoFor = env.hijo("for");

        this.inicio.execute(entornoFor);

        while (aBool(this.condicion.evaluate(entornoFor))) {
            const senal = this.cuerpo.execute(entornoFor.hijo("cuerpo"));

            if (senal.tipo === "break") {
                break;
            }

            if (senal.tipo === "return") {
                return senal;
            }

            this.cambio.execute(entornoFor);
        }

        return NORMAL;
    }
}

export class Romper extends Instruccion {
    execute(): Senal {
        return BREAK;
    }
}

export class Continuar extends Instruccion {
    execute(): Senal {
        return CONTINUE;
    }
}

export class Retornar extends Instruccion {
    constructor(l: number, c: number, private readonly valor: Expresion | null) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        return {
            tipo: "return",
            valor: this.valor === null ? VNULL : this.valor.evaluate(env)
        };
    }
}

export class Ejecutar extends Instruccion {
    constructor(l: number, c: number, private readonly task: string) {
        super(l, c);
    }

    execute(env: Entorno): Senal {
        const t = env.ctx.tasks.get(this.task);

        if (t === undefined) {
            throw this.error(`Task '${this.task}' no definida.`);
        }

        t.ejecutar(env.ctx);
        return NORMAL;
    }
}


/* =========================================================
   DECLARACIONES GLOBALES
   ========================================================= */

export class FuncionDeclarada extends Nodo {
    constructor(
        l: number, c: number,
        public readonly nombre: string,
        public readonly parametros: Array<{ nombre: string; tipo: TipoDeclarado; linea: number; columna: number }>,
        public readonly retorno: TipoDeclarado,
        private readonly cuerpo: Bloque
    ) {
        super(l, c);
    }

    firma(): string {
        const ps = this.parametros.map((p) => `${nombreTipo(p.tipo)} ${p.nombre}`).join(", ");
        return `(${ps}) -> ${nombreTipo(this.retorno)}`;
    }

    /**
     * Cada llamada crea un entorno nuevo enlazado al entorno GLOBAL,
     * donde la función fue declarada.
     */
    invocar(llamador: Entorno, args: Valor[]): Valor {
        const ctx = llamador.ctx;
        const global = ctx.entornoGlobal();
        const local = new Entorno(this.nombre, global, ctx);

        this.parametros.forEach((p, i) => {
            const valor = i < args.length ? args[i] : valorPorDefecto(p.tipo);

            local.declarar({
                nombre: p.nombre,
                categoria: "parámetro",
                tipo: nombreTipo(p.tipo),
                valor: coaccionar(valor, p.tipo),
                tipoDeclarado: p.tipo,
                linea: p.linea,
                columna: p.columna
            });
        });

        const senal = this.cuerpo.execute(local);

        if (senal.tipo === "return" && senal.valor !== undefined) {
            return coaccionar(senal.valor, this.retorno);
        }

        return VNULL;
    }
}

export class TaskDeclarada extends Nodo {
    constructor(
        l: number, c: number,
        public readonly nombre: string,
        private readonly cuerpo: Bloque
    ) {
        super(l, c);
    }

    ejecutar(ctx: import("./context").Contexto): void {
        this.cuerpo.execute(new Entorno(this.nombre, ctx.entornoGlobal(), ctx));
    }
}

export class RecursoDeclarado extends Nodo {
    constructor(
        l: number, c: number,
        public readonly tipo: TipoRecurso,
        public readonly nombre: string,
        public readonly propiedades: Array<{ nombre: string; valor: Expresion }>
    ) {
        super(l, c);
    }

    /** Fase 1: crea el recurso para que pueda ser referenciado. */
    registrar(env: Entorno): Recurso {
        const r = new Recurso(this.nombre, this.tipo, this.linea, this.columna);

        env.ctx.recursos.push(r);

        env.declarar({
            nombre: this.nombre,
            categoria: "recurso",
            tipo: this.tipo,
            valor: vRes(r),
            tipoDeclarado: { name: this.tipo, isArray: false },
            linea: this.linea,
            columna: this.columna
        });

        env.ctx.log("OK", `Resource '${this.nombre}' registered`, this.linea, this.columna);

        return r;
    }

    /** Fase 2: evalúa las propiedades declaradas. */
    inicializar(env: Entorno, r: Recurso): void {
        for (const p of this.propiedades) {
            r.asignar(p.nombre, p.valor.evaluate(env));
        }
    }
}

export class Programa {
    constructor(
        private readonly declaraciones: Array<DeclaracionVariable | RecursoDeclarado | FuncionDeclarada | TaskDeclarada>,
        private readonly principal: Bloque
    ) { }

    ejecutar(global: Entorno): void {
        const ctx = global.ctx;
        const recursos = new Map<RecursoDeclarado, Recurso>();

        /* Fase 1: registrar recursos, funciones y tareas globales. */
        for (const d of this.declaraciones) {
            if (d instanceof RecursoDeclarado) {
                recursos.set(d, d.registrar(global));
            } else if (d instanceof FuncionDeclarada) {
                ctx.funciones.set(d.nombre, d);

                global.declarar({
                    nombre: d.nombre,
                    categoria: "función",
                    tipo: nombreTipo(d.retorno),
                    valor: null,
                    tipoDeclarado: null,
                    detalle: d.firma(),
                    linea: d.linea,
                    columna: d.columna
                });
            } else if (d instanceof TaskDeclarada) {
                ctx.tasks.set(d.nombre, d);

                global.declarar({
                    nombre: d.nombre,
                    categoria: "task",
                    tipo: "task",
                    valor: null,
                    tipoDeclarado: null,
                    detalle: "task",
                    linea: d.linea,
                    columna: d.columna
                });
            }
        }

        /* Fase 2: variables globales y propiedades, en orden de aparición. */
        for (const d of this.declaraciones) {
            if (d instanceof DeclaracionVariable) {
                d.execute(global);
            } else if (d instanceof RecursoDeclarado) {
                d.inicializar(global, recursos.get(d)!);
            }
        }

        /* Fase 3: bloque main. */
        this.principal.execute(new Entorno("main", global, ctx));
    }
}


/* =========================================================
   CONSTRUCCIÓN: AST plano (Jison) -> nodos ejecutables
   ========================================================= */

/* eslint-disable @typescript-eslint/no-explicit-any */
type NodoPlano = any;

const pos = (n: NodoPlano): [number, number] => [n?.line ?? 0, n?.column ?? 0];

export function construirExpresion(n: NodoPlano): Expresion {
    const [l, c] = pos(n);

    switch (n.type) {
        case "LiteralExpression": {
            const t = n.literalType as string;
            const v: Valor =
                t === "int" ? vInt(n.value) :
                    t === "float" ? vFloat(n.value) :
                        t === "bool" ? vBool(n.value) :
                            vStr(n.value);
            return new Literal(l, c, v);
        }

        case "IdentifierExpression":
            return new Identificador(l, c, n.name);

        case "ArrayExpression":
            return new ArregloLiteral(l, c, n.elements.map(construirExpresion));

        case "UnaryExpression":
            return new Unaria(l, c, n.operator, construirExpresion(n.operand));

        case "BinaryExpression":
            return new Binaria(
                l, c, n.operator,
                construirExpresion(n.left),
                construirExpresion(n.right)
            );

        case "PropertyAccessExpression":
            return new AccesoPropiedad(l, c, construirExpresion(n.object), n.property);

        case "IndexExpression":
            return new AccesoIndice(l, c, construirExpresion(n.object), construirExpresion(n.index));

        case "CallExpression":
            return new Llamada(
                l, c,
                n.callee.type === "IdentifierExpression" ? n.callee.name : null,
                n.arguments.map(construirExpresion)
            );

        default:
            throw new Error(`Expresión desconocida: ${n.type}`);
    }
}

export function construirBloque(n: NodoPlano): Bloque {
    return new Bloque(0, 0, n.statements.map(construirInstruccion));
}

export function construirInstruccion(n: NodoPlano): Instruccion {
    const [l, c] = pos(n);

    switch (n.type) {
        case "VariableDeclaration":
            return new DeclaracionVariable(
                l, c, n.name, n.variableType,
                n.initializer ? construirExpresion(n.initializer) : null
            );

        case "Assignment":
            return new Asignacion(l, c, construirExpresion(n.target), construirExpresion(n.value));

        case "ExpressionStatement":
            return new InstruccionExpresion(l, c, construirExpresion(n.expression));

        case "IfInstruction":
            return new Si(
                l, c,
                construirExpresion(n.condition),
                construirBloque(n.thenBranch),
                n.elseBranch === null
                    ? null
                    : n.elseBranch.type === "IfInstruction"
                        ? (construirInstruccion(n.elseBranch) as Si)
                        : construirBloque(n.elseBranch)
            );

        case "WhileInstruction":
            return new Mientras(l, c, construirExpresion(n.condition), construirBloque(n.body));

        case "ForInstruction":
            return new Para(
                l, c,
                construirInstruccion(n.initializer),
                construirExpresion(n.condition),
                construirInstruccion(n.update),
                construirBloque(n.body)
            );

        case "BreakInstruction":
            return new Romper(l, c);

        case "ContinueInstruction":
            return new Continuar(l, c);

        case "ReturnInstruction":
            return new Retornar(l, c, n.value ? construirExpresion(n.value) : null);

        case "RunInstruction":
            return new Ejecutar(l, c, n.taskName);

        default:
            throw new Error(`Instrucción desconocida: ${n.type}`);
    }
}

export function construirPrograma(ast: NodoPlano): Programa {
    const declaraciones = ast.declarations.map((d: NodoPlano) => {
        const [l, c] = pos(d);

        switch (d.type) {
            case "VariableDeclaration":
                return construirInstruccion(d) as DeclaracionVariable;

            case "ResourceDeclaration":
                return new RecursoDeclarado(
                    l, c, d.resourceType, d.name,
                    d.properties.map((p: NodoPlano) => ({
                        nombre: p.name,
                        valor: construirExpresion(p.value)
                    }))
                );

            case "FunctionDeclaration":
                return new FuncionDeclarada(
                    l, c, d.name,
                    d.parameters.map((p: NodoPlano) => ({
                        nombre: p.name,
                        tipo: p.parameterType,
                        linea: p.line ?? 0,
                        columna: p.column ?? 0
                    })),
                    d.returnType,
                    construirBloque(d.body)
                );

            case "TaskDeclaration":
                return new TaskDeclarada(l, c, d.name, construirBloque(d.body));

            default:
                throw new Error(`Declaración desconocida: ${d.type}`);
        }
    });

    return new Programa(declaraciones, construirBloque(ast.main.body));
}

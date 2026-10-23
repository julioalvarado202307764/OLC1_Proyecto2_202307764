import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

import { analizarCodigo } from "../analizador/parser";
import { ejecutarPrograma } from "../interpreter/interpreter";
import type { ResultadoEjecucion } from "../interpreter/interpreter";

/* =========================================================
   Pruebas del intérprete: ejecutan código AutoInfra real
   (Jison -> AST -> nodos ejecutables) y comparan la salida.
   Uso:  npm test
   ========================================================= */

interface Ejecucion {
    r: ResultadoEjecucion;
    lex: number;
    syn: number;
}

function correr(codigo: string): Ejecucion {
    const a = analizarCodigo(codigo);
    assert.ok(a.ast, "el programa debe producir AST: " + JSON.stringify(a.erroresSintacticos));
    return {
        r: ejecutarPrograma(a.ast),
        lex: a.erroresLexicos.length,
        syn: a.erroresSintacticos.length
    };
}

let total = 0;
const fallos: string[] = [];

function prueba(nombre: string, fn: () => void): void {
    total++;
    try {
        fn();
        console.log(`  ok   ${nombre}`);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        fallos.push(`${nombre}: ${msg}`);
        console.log(`  FAIL ${nombre}\n       ${msg.split("\n").join("\n       ")}`);
    }
}

/** Ejecuta `main { ... }` con declaraciones globales opcionales y devuelve print(). */
function salida(main: string, globales = ""): string[] {
    const { r } = correr(`${globales}\nmain {\n${main}\n}`);
    assert.deepStrictEqual(r.errores, [], "no se esperaban errores: " + JSON.stringify(r.errores));
    return r.salida;
}

const SERVIDORES = `
server backend { cpu = 4; memory = 8; disk = 100; os = "ubuntu"; }
database postgres { engine = "postgresql"; version = "16"; port = 5432; }
service api { port = 8080; replicas = 2; dependsOn = [postgres]; }
`;

console.log("Variables, tipos y valores por defecto");

prueba("valores por defecto de int/float/string/bool", () => {
    assert.deepStrictEqual(
        salida(`int a; float b; string c; bool d; print(a, b, "[" + c + "]", d);`),
        ["0 0.0 [] false"]
    );
});

prueba("declaraciones globales con y sin inicializador", () => {
    assert.deepStrictEqual(
        salida(`print(g, h, t);`, `int g = 7; int h; string t = "x";`),
        ["7 0 x"]
    );
});

prueba("int se promueve a float al declarar float", () => {
    assert.deepStrictEqual(salida(`float f = 2; print(f, f + 1);`), ["2.0 3.0"]);
});

console.log("Operaciones aritméticas y precedencia");

prueba("precedencia * / % sobre + -", () => {
    assert.deepStrictEqual(salida(`print(1 + 2 * 3, (1 + 2) * 3, 10 - 4 - 3);`), ["7 9 3"]);
});

prueba("división siempre float; módulo entero", () => {
    assert.deepStrictEqual(salida(`print(7 % 3, 5 / 2, 10 / 2, 2.5 + 1);`), ["1 2.5 5.0 3.5"]);
});

prueba("int x = 10 / 2 almacena entero", () => {
    assert.deepStrictEqual(salida(`int x = 10 / 2; print(x);`), ["5"]);
});

prueba("operadores unarios", () => {
    assert.deepStrictEqual(salida(`print(-5, -(2 + 3), --4, !true, !!true);`), ["-5 -5 4 false true"]);
});

prueba("concatenación con string", () => {
    assert.deepStrictEqual(
        salida(`print("worker-" + 3, "x" + 2.5, "a" + true, 1 + "b");`),
        ["worker-3 x2.5 atrue 1b"]
    );
});

console.log("Operaciones relacionales y lógicas");

prueba("relacionales e igualdad", () => {
    assert.deepStrictEqual(
        salida(`print(3 < 4, 3 >= 4, 2 <= 2, 5 > 1, "a" == "a", 1 == 1.0, 1 != 2, true == false);`),
        ["true false true true true true true false"]
    );
});

prueba("lógicos", () => {
    assert.deepStrictEqual(
        salida(`print(true && !false, false || true, true && false, false || false);`),
        ["true true false false"]
    );
});

prueba("corto circuito && y ||", () => {
    const g = `function boom() bool { print("boom"); return true; }`;
    assert.deepStrictEqual(
        salida(`
            if (false && boom()) { print("a"); }
            if (true || boom()) { print("b"); }
            if (true && boom()) { print("c"); }
            if (false || boom()) { print("d"); }
        `, g),
        ["b", "boom", "c", "boom", "d"]
    );
});

console.log("Condicionales");

prueba("if / else if / else y anidamiento", () => {
    assert.deepStrictEqual(
        salida(`
            for (int i = 0; i < 4; i = i + 1) {
                if (i == 0) { print("cero"); }
                else if (i == 1) { print("uno"); }
                else if (i == 2) {
                    if (i % 2 == 0) { print("dos-par"); } else { print("dos-impar"); }
                } else { print("otro"); }
            }
        `),
        ["cero", "uno", "dos-par", "otro"]
    );
});

console.log("Ciclos");

prueba("while con actualización de variable", () => {
    assert.deepStrictEqual(
        salida(`int i = 0; while (i < 3) { print(i); i = i + 1; } print("fin", i);`),
        ["0", "1", "2", "fin 3"]
    );
});

prueba("for con break y continue", () => {
    assert.deepStrictEqual(
        salida(`
            for (int i = 0; i < 10; i = i + 1) {
                if (i == 2) { continue; }
                if (i == 5) { break; }
                print(i);
            }
        `),
        ["0", "1", "3", "4"]
    );
});

prueba("break solo afecta al ciclo interno", () => {
    assert.deepStrictEqual(
        salida(`
            for (int i = 0; i < 2; i = i + 1) {
                int j = 0;
                while (true) { if (j == 2) { break; } print(i, j); j = j + 1; }
            }
        `),
        ["0 0", "0 1", "1 0", "1 1"]
    );
});

prueba("return dentro de ciclo termina la función", () => {
    assert.deepStrictEqual(
        salida(`print(primero(10));`,
            `function primero(int n) int { for (int i = 1; i <= n; i = i + 1) { if (i * i > 20) { return i; } } return 0; }`),
        ["5"]
    );
});

console.log("Arreglos");

prueba("literales, índice, length y asignación por índice", () => {
    assert.deepStrictEqual(
        salida(`int[] a = [1, 2, 3]; a[1] = 20; print(a[1], length(a), a);`),
        ["20 3 [1, 20, 3]"]
    );
});

prueba("float[] promueve elementos", () => {
    assert.deepStrictEqual(salida(`float[] f = [1, 2.5]; print(f);`), ["[1.0, 2.5]"]);
});

prueba("arreglo sin inicializador está vacío", () => {
    assert.deepStrictEqual(salida(`string[] s; print(length(s));`), ["0"]);
});

prueba("índice fuera de rango produce error de ejecución", () => {
    const { r } = correr(`main { int[] a = [1]; print(a[3]); print("no"); }`);
    assert.strictEqual(r.errores.length, 1);
    assert.strictEqual(r.errores[0].tipo, "Ejecución");
    assert.match(r.errores[0].descripcion, /fuera de rango/);
    assert.deepStrictEqual(r.salida, []);
});

console.log("Funciones y ámbitos");

prueba("parámetros tipados y return", () => {
    assert.deepStrictEqual(
        salida(`print(suma(2, 3), saludo(), mitad(5), id(3));`,
            `function suma(int a, int b) int { return a + b; }
             function saludo() string { return "hola"; }
             function mitad(float x) float { return x / 2; }
             function id(float x) float { return x; }`),
        ["5 hola 2.5 3.0"]
    );
});

prueba("recursión: factorial y fibonacci", () => {
    assert.deepStrictEqual(
        salida(`print(fact(5), fib(10), fact(fact(3)));`,
            `function fact(int n) int { if (n <= 1) { return 1; } return n * fact(n - 1); }
             function fib(int n) int { if (n < 2) { return n; } return fib(n - 1) + fib(n - 2); }`),
        ["120 55 720"]
    );
});

prueba("recursión con efectos (countdown)", () => {
    assert.deepStrictEqual(
        salida(`print(countdown(3));`,
            `function countdown(int n) int { if (n <= 0) { return 0; } print(n); return countdown(n - 1); }`),
        ["3", "2", "1", "0"]
    );
});

prueba("la local oculta a la global sin modificarla", () => {
    assert.deepStrictEqual(
        salida(`print(x, f(), x);`,
            `int x = 1; function f() int { int x = 2; return x; }`),
        ["1 2 1"]
    );
});

prueba("la función puede modificar variables globales", () => {
    assert.deepStrictEqual(
        salida(`inc(); inc(); print(contador);`,
            `int contador = 0; function inc() int { contador = contador + 1; return contador; }`),
        ["2"]
    );
});

prueba("bloques: sombreado y vida de variables locales", () => {
    assert.deepStrictEqual(
        salida(`int x = 10; if (true) { int x = 20; print(x); } print(x);`),
        ["20", "10"]
    );
});

prueba("la función NO ve las variables locales del llamador", () => {
    const { r } = correr(`function peek() int { return secreto; } main { int secreto = 5; print(peek()); }`);
    assert.strictEqual(r.errores.length, 1);
    assert.match(r.errores[0].descripcion, /'secreto' no definido/);
    assert.ok(r.errores[0].linea > 0 && r.errores[0].columna > 0);
});

prueba("variable no definida detiene la ejecución", () => {
    const { r } = correr(`main { print("a"); x = 5; print("b"); }`);
    assert.strictEqual(r.abortada, true);
    assert.deepStrictEqual(r.salida, ["a"]);
});

console.log("Recursos, propiedades y tasks");

prueba("lectura de propiedades y status inicial", () => {
    assert.deepStrictEqual(
        salida(`print(backend.cpu, backend.os, backend.status, api.status, api.host, postgres.port);`, SERVIDORES),
        ["4 ubuntu stopped undeployed null 5432"]
    );
});

prueba("dependsOn, length(api.dependsOn) y cadena api.host.os", () => {
    assert.deepStrictEqual(
        salida(`
            print(length(api.dependsOn) > 0, api.dependsOn[0] == postgres);
            start(postgres); start(backend); deploy(backend, api);
            print(api.host.os, api.host == backend);
        `, SERVIDORES),
        ["true true", "ubuntu true"]
    );
});

prueba("asignación a propiedad de recurso", () => {
    assert.deepStrictEqual(
        salida(`backend.memory = 16; print(backend.memory);`, SERVIDORES),
        ["16"]
    );
});

prueba("tasks se ejecutan en orden con run", () => {
    assert.deepStrictEqual(
        salida(`run a; run b; run a;`, `task a { print("A"); } task b { print("B"); }`),
        ["A", "B", "A"]
    );
});

prueba("task puede invocar funciones y funciones nativas", () => {
    assert.deepStrictEqual(
        salida(`run t;`, `function dos() int { return 2; } task t { print(dos() * 2); }`),
        ["4"]
    );
});

prueba("run de una task inexistente es error de ejecución", () => {
    const { r } = correr(`main { run nada; }`);
    assert.match(r.errores[0].descripcion, /Task 'nada' no definida/);
});

console.log("Acciones nativas");

prueba("start/stop/status/restart", () => {
    assert.deepStrictEqual(
        salida(`
            print(status(backend));
            print(start(backend), status(backend));
            print(start(backend));
            print(restart(backend));
            print(stop(backend), status(backend));
            print(stop(backend));
            print(restart(backend));
        `, SERVIDORES),
        ["stopped", "true running", "false", "true", "true stopped", "false", "false"]
    );
});

prueba("install / uninstall y packages", () => {
    assert.deepStrictEqual(
        salida(`
            print(install(backend, "docker"), install(backend, "git"), length(backend.packages));
            print(install(backend, "docker"));
            print(uninstall(backend, "docker"), backend.packages);
            print(uninstall(backend, "docker"));
        `, SERVIDORES),
        ["true true 2", "false", "true [git]", "false"]
    );
});

prueba("deploy asocia host y activa; scale cambia réplicas", () => {
    assert.deepStrictEqual(
        salida(`
            start(postgres);
            print(deploy(backend, api), api.status, api.host.nombre_inexistente);
            scale(api, 5);
            print(api.replicas);
        `, SERVIDORES),
        ["true running null", "5"]
    );
});

prueba("INFRA-004: deploy con dependencia detenida", () => {
    const { r } = correr(`${SERVIDORES}
main {
    start(backend);
    print(deploy(backend, api));
    print(api.status);
}`);
    assert.deepStrictEqual(r.salida, ["false", "undeployed"]);
    assert.strictEqual(r.errores.length, 1);
    assert.strictEqual(r.errores[0].codigo, "INFRA-004");
    assert.strictEqual(r.errores[0].tipo, "Infraestructura");
    assert.strictEqual(r.errores[0].linea, 8);
    assert.strictEqual(r.errores[0].columna, 11);
    assert.match(r.errores[0].descripcion, /Dependencia 'postgres' se encuentra en estado stopped/);
    assert.strictEqual(r.abortada, false);
});

prueba("connect / disconnect", () => {
    const { r } = correr(`${SERVIDORES}
main { print(connect(api, postgres)); print(disconnect(api, postgres)); print(disconnect(api, postgres)); }`);
    assert.deepStrictEqual(r.salida, ["true", "true", "false"]);
    assert.strictEqual(r.conexiones.length, 0);
});

console.log("Archivos de ejemplo del enunciado (examples/)");

const ejemplos = path.join(__dirname, "..", "..", "examples");

function ejemplo(archivo: string): Ejecucion {
    return correr(fs.readFileSync(path.join(ejemplos, archivo), "utf8"));
}

prueba("basico.infra", () => {
    const { r } = ejemplo("basico.infra");
    assert.strictEqual(r.errores.length, 0);
    const web = r.recursos.find((x) => x.nombre === "web")!;
    assert.strictEqual(web.estado, "running");
    assert.deepStrictEqual(web.paquetes(), ["nginx"]);
    assert.strictEqual(r.recursos.find((x) => x.nombre === "frontend")!.estado, "running");
});

prueba("intermedio.infra", () => {
    const { r } = ejemplo("intermedio.infra");
    assert.strictEqual(r.errores.length, 0);
    assert.deepStrictEqual(r.recursos[0].paquetes(), ["docker", "git", "nginx"]);
});

prueba("avanzado.infra (salida esperada 22.5)", () => {
    const { r } = ejemplo("avanzado.infra");
    assert.strictEqual(r.errores.length, 0);
    assert.ok(r.consola.includes("[OK] api scaled to 5 replicas"));
    const api = r.recursos.find((x) => x.nombre === "api")!;
    assert.strictEqual(api.estado, "running");
    const rep = api.obtener("replicas");
    assert.ok(rep.t === "int" && rep.v === 5);
});

prueba("integral.infra (sección 30)", () => {
    const { r } = ejemplo("integral.infra");
    assert.deepStrictEqual(r.salida, [
        "API disponible en puerto 8080",
        "Servidor: ubuntu",
        "Réplicas: 3"
    ]);
});

prueba("el error léxico se reporta con su descripción", () => {
    const a = analizarCodigo(`main { int x = 10 @ 2; }`);
    assert.strictEqual(a.erroresLexicos.length, 1);
    assert.strictEqual(a.erroresLexicos[0].descripcion, "Carácter no reconocido");
});

prueba("propiedad de recurso sin ';' se reporta como error sintáctico", () => {
    const a = analizarCodigo(`server s { host = "a" } main { print(1); }`);
    assert.strictEqual(a.erroresSintacticos.length, 1);
    assert.strictEqual(a.erroresSintacticos[0].tipo, "Sintáctico");
});

prueba("declaraciones sin inicializador son sintácticamente válidas", () => {
    const a = analizarCodigo(`int g; server s; main { int[] a; service t; }`);
    assert.strictEqual(a.erroresSintacticos.length, 0);
    assert.ok(a.ast);
});

console.log(`\n${total - fallos.length}/${total} pruebas correctas`);

if (fallos.length > 0) {
    console.log("\nFallos:\n - " + fallos.join("\n - "));
    process.exit(1);
}

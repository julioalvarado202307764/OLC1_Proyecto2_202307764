import { analizarCodigo } from "./parser";

const codigo = `string[] packages = ["docker", "git", "nginx"];

database postgres {
    engine = "postgresql";
    version = "16";
    port = 5432;
}

server backend {
    cpu = 4;
    memory = 16;
    disk = 100;
    os = "ubuntu";
}

service api {
    port = 8080;
    replicas = 2;
    dependsOn = [postgres];
}

function canDeploy(server s, int minMemory) bool {
    return s.memory >= minMemory;
}

task deployProduction {
    int attempts = 0;

    start(postgres);
    start(backend);

    while (attempts < 2) {
        print(attempts);
        attempts = attempts + 1;
    }

    for (int i = 0; i < 3; i = i + 1) {
        if (i == 1) {
            continue;
        }

        if (i == 2) {
            break;
        }

        print(i);
    }

    if (canDeploy(backend, 8)) {
        install(backend, packages[0]);
        deploy(backend, api);
        start(api);
    } else {
        print("Not enough memory");
    }
}

main {
    run deployProduction;
}`;

const resultado = analizarCodigo(codigo);

console.log("AST:");
console.log(JSON.stringify(resultado.ast, null, 2));

console.log("\nERRORES SINTÁCTICOS:");
console.log(JSON.stringify(resultado.erroresSintacticos, null, 2));

console.log("\nERRORES LÉXICOS:");
console.log(JSON.stringify(resultado.erroresLexicos, null, 2));
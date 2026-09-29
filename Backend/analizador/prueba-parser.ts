const moduloGenerado = require("./analizador.js");

const parser = moduloGenerado.parser ?? moduloGenerado;

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
    start(postgres);
    start(backend);

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

const ast = parser.parse(codigo);

console.log(JSON.stringify(ast, null, 2));
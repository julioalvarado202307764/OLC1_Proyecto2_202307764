import router from "./analisis.route";

const stack = (router as any).stack;

console.log("=== ROUTES REGISTRADAS ===");

for (const layer of stack) {
    if (!layer.route) {
        continue;
    }

    console.log({
        path: layer.route.path,
        methods: layer.route.methods
    });
}
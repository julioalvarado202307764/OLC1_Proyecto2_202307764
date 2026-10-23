# AutoInfra — Frontend

Interfaz web (React + TypeScript + Vite) de AutoInfra: editor de archivos `.infra`, análisis, ejecución y visualización de resultados. Consume la API REST del Backend.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run lint
```

La dirección del Backend es `http://localhost:3000` por defecto; puede cambiarse con la variable `VITE_API_URL` en un archivo `.env` de esta carpeta.

Instrucciones completas, estructura y documentación: ver el [README principal](../README.md).

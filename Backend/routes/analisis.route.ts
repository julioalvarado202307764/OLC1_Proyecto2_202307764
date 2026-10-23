import { Router } from "express";
import {
    analizar,
    ejecutar,
    salud
} from "../controllers/analisis.controller";

const router = Router();

/* Análisis sin ejecución. */
router.post("/analizar", analizar);
router.post("/api/analyze", analizar);

/* Análisis + ejecución. */
router.post("/api/execute", ejecutar);

router.get("/api/health", salud);

export default router;

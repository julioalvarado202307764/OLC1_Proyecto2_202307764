import { Router } from "express";
import { analizar } from "../controllers/analisis.controller";

const router = Router();

router.post("/analizar", analizar);

export default router;
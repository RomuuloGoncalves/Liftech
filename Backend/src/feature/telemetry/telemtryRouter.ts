import { Router } from "express";
import { listar, buscar, criar, deletar, atualizar } from "./telemetryController.js";

const router = Router();

// Exemplo de uso: GET /telemetry?dispositivoId=65...
router.get("/", listar);
router.get("/:id", buscar);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", deletar);

export default router;
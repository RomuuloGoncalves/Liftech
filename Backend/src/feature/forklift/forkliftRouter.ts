import { Router } from "express";
import { listar, buscar, criar, deletar, atualizar } from "./forkliftController.js";

const router = Router();

router.get("/", listar);
router.get("/:id", buscar);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", deletar);

export default router;

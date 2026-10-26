import { Router } from "express";
import { listar, alterarStatus, travar, mover, criar, atualizar, deletar } from "./machineController.js";

const router = Router();

router.get("/", listar);
router.put("/categoria", mover);
router.put("/:id/status", alterarStatus);
router.put("/:id/trava", travar);
// Depois das rotas fixas: "/:id" casaria "/categoria".
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", deletar);

export default router;

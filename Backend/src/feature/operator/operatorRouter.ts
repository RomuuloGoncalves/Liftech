import { Router } from "express";
import { listar, criar, atualizar, deletar, criarLogin, atualizarLogin, removerLogin } from "./operatorController.js";

const router = Router();

router.get("/", listar);
router.post("/", criar);
router.put("/:id", atualizar);
router.delete("/:id", deletar);
router.post("/:id/login", criarLogin);
router.put("/:id/login", atualizarLogin);
router.delete("/:id/login", removerLogin);

export default router;

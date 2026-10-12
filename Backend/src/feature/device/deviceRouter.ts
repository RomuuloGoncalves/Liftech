import { Router } from "express";
import * as controller from "./deviceController.js";

const router = Router();

router.post("/", controller.criar);
router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.put("/:id", controller.atualizar);
router.delete("/:id", controller.deletar);
router.post("/:id/assign", controller.assign);

export default router;
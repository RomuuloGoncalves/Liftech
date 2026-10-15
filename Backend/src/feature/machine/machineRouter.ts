import { Router } from "express";
import { listar, alterarStatus, travar, mover } from "./machineController.js";

const router = Router();

router.get("/", listar);
router.put("/categoria", mover);
router.put("/:id/status", alterarStatus);
router.put("/:id/trava", travar);

export default router;

import { Router } from "express";
import { listar, alterarStatus } from "./machineController.js";

const router = Router();

router.get("/", listar);
router.put("/:id/status", alterarStatus);

export default router;

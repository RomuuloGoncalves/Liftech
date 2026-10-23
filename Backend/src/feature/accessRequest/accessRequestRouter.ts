import { Router } from "express";
import { criar, listar, aprovar, recusar } from "./accessRequestController.js";

const router = Router();

router.post("/", criar);

// TEMP: sem auth por decisão do dono; travar com exigirAdmin
router.get("/", listar);
router.put("/:id/aprovar", aprovar);
router.put("/:id/recusar", recusar);

export default router;

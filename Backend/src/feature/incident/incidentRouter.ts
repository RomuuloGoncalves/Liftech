import { Router } from "express";
import { reportar, listar } from "./incidentController.js";

const router = Router();

router.get("/", listar);
router.post("/", reportar);

export default router;

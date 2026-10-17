import { Router } from "express";
import { atual, iniciar, encerrar, listar } from "./sessionController.js";

const router = Router();

router.get("/atual", atual);
router.put("/atual/encerrar", encerrar);
router.get("/", listar);
router.post("/", iniciar);

export default router;

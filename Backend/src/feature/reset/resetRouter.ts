import { Router } from "express";
import { resetar } from "./resetController.js";

const router = Router();

// GET para abrir direto no navegador.
router.get("/", resetar);

export default router;

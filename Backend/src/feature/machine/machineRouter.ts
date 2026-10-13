import { Router } from "express";
import { listar } from "./machineController.js";

const router = Router();

router.get("/", listar);

export default router;

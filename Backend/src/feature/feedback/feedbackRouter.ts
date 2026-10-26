import { Router } from "express";
import { enviar } from "./feedbackController.js";

const router = Router();

router.post("/", enviar);

export default router;

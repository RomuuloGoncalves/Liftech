import { Router } from "express";
import { criar } from "./accessRequestController.js";

const router = Router();

router.post("/", criar);

export default router;

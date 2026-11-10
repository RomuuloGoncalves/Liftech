import { Router } from "express";
import { conectar } from "./streamHub.js";

const streamRouter = Router();

streamRouter.get("/", conectar);

export default streamRouter;

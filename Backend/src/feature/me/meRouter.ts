import { Router } from "express";
import { atualizar, excluir } from "./meController.js";

const meRouter = Router();

meRouter.put("/", atualizar);
meRouter.delete("/", excluir);

export default meRouter;

import type { Request, Response } from "express";
import type { forkliftService } from "./forkliftService.js";

export class forkliftController {
    constructor (private service: forkliftService) {}

    create = async (req: Request, res: Response) => {
        try {
            const forklift = await this.service.criarEmpilhadeira(req.body);
            return res.status(201).json(forklift);
        } catch (err) {
            return res.status(400).json({message: (err as Error).message});
        }    
    }
}
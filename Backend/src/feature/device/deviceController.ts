import { Request, Response } from "express";
import { DeviceService } from "./deviceService.js";
import { DeviceRepository } from "./deviceRepository.js";
import { Device } from "../../schemas/device.js"; 
import regras, { regrasAssign } from "./deviceRules.js";
import mongoose from "mongoose";

const servicoDevice = new DeviceService(new DeviceRepository(Device));

export async function criar(req: Request, res: Response) {
    try {
        const erros = regras.check(req.body);
        if (erros && Object.keys(erros).length > 0) {
            return res.status(400).json({ error: erros });
        }

        const dispositivo = await servicoDevice.criar(req.body);
        return res.status(201).json(dispositivo.obterDados());
    } catch (error: any) {
        if (error.message.includes("Já existe um dispositivo")) {
            return res.status(409).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message });
    }
}

export async function listar(req: Request, res: Response) {
    try {
        const dispositivos = await servicoDevice.listar();
        return res.status(200).json(dispositivos.map(d => d.obterDados()));
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export async function buscar(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        
        const dispositivo = await servicoDevice.obterPorId(id); 
        
        if (!dispositivo) {
            return res.status(404).json({ error: "Dispositivo não encontrado." });
        }
        
        return res.status(200).json(dispositivo.obterDados());
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export async function atualizar(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const dispositivo = await servicoDevice.atualizar(id, req.body);
        
        if (!dispositivo) {
            return res.status(404).json({ error: "Dispositivo não encontrado." });
        }
        
        return res.status(200).json(dispositivo.obterDados());
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export async function deletar(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const sucesso = await servicoDevice.deletar(id);
        
        if (!sucesso) {
            return res.status(404).json({ error: "Dispositivo não encontrado." });
        }
        
        return res.status(200).json({ message: "Dispositivo removido com sucesso." });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

export async function assign(req: Request, res: Response) {
    try {
        const id = req.params.id as string;
        const { empilhadeiraId } = req.body;

        if (empilhadeiraId && !mongoose.Types.ObjectId.isValid(empilhadeiraId)) {
            return res.status(400).json({ 
                error: "O campo 'empilhadeiraId' deve ser um ObjectId válido do MongoDB." 
            });
        }

        const dispositivo = await servicoDevice.associar(id, empilhadeiraId || null);
        
        if (!dispositivo) {
            return res.status(404).json({ error: "Dispositivo não encontrado." });
        }

        return res.status(200).json(dispositivo.obterDados());
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
import { Request, Response } from "express";
import mongoose from "mongoose";
import { DeviceService } from "./deviceService.js";
import { DeviceRepository } from "./deviceRepository.js";
import { Device } from "../../schemas/device.js";
import regras from "./deviceRules.js";
import { filtroPorFilial, resolverFilial } from "../../core/escopo.js";
import { StatusCode, respostaErro, respostaSucesso, responderErro } from "../../utils/responseHandler.js";

const servicoDevice = new DeviceService(new DeviceRepository(Device));

export async function criar(req: Request, res: Response) {
    try {
        const erros = regras.check(req.body);
        if (erros && Object.keys(erros).length > 0) {
            return respostaErro(res, StatusCode.BAD_REQUEST, erros);
        }

        const filialId = resolverFilial(req.escopo, req.body.filialId);
        const dispositivo = await servicoDevice.criar({ ...req.body, filialId });
        return respostaSucesso(res, StatusCode.CREATED, dispositivo.obterDados());
    } catch (error: any) {
        if (error.message.includes("Já existe um dispositivo")) {
            return respostaErro(res, StatusCode.CONFLICT, error.message);
        }
        return responderErro(res, error);
    }
}

export async function listar(req: Request, res: Response) {
    try {
        const dispositivos = await servicoDevice.listar(filtroPorFilial(req.escopo));
        return respostaSucesso(res, StatusCode.OK, dispositivos.map(d => d.obterDados()));
    } catch (error: any) {
        return responderErro(res, error);
    }
}

export async function buscar(req: Request, res: Response) {
    try {
        const dispositivo = await servicoDevice.obterPorId(req.params.id as string, filtroPorFilial(req.escopo));
        return respostaSucesso(res, StatusCode.OK, dispositivo.obterDados());
    } catch (error: any) {
        if (error.message.includes("não encontrado")) {
            return respostaErro(res, StatusCode.NOT_FOUND, error.message);
        }
        return responderErro(res, error);
    }
}

export async function atualizar(req: Request, res: Response) {
    try {
        const dados = { ...req.body };
        // Trocar a filial também precisa caber no escopo de quem atualiza.
        if (dados.filialId !== undefined) {
            dados.filialId = resolverFilial(req.escopo, dados.filialId);
        }
        const dispositivo = await servicoDevice.atualizar(req.params.id as string, dados, filtroPorFilial(req.escopo));
        return respostaSucesso(res, StatusCode.OK, dispositivo.obterDados());
    } catch (error: any) {
        if (error.message.includes("não encontrado")) {
            return respostaErro(res, StatusCode.NOT_FOUND, error.message);
        }
        return responderErro(res, error);
    }
}

export async function deletar(req: Request, res: Response) {
    try {
        await servicoDevice.deletar(req.params.id as string, filtroPorFilial(req.escopo));
        return respostaSucesso(res, StatusCode.OK, { message: "Dispositivo removido com sucesso." });
    } catch (error: any) {
        if (error.message.includes("não encontrado")) {
            return respostaErro(res, StatusCode.NOT_FOUND, error.message);
        }
        return responderErro(res, error);
    }
}

export async function assign(req: Request, res: Response) {
    try {
        const { empilhadeiraId } = req.body;

        if (empilhadeiraId && !mongoose.Types.ObjectId.isValid(empilhadeiraId)) {
            return respostaErro(res, StatusCode.BAD_REQUEST, "O campo 'empilhadeiraId' deve ser um ObjectId válido do MongoDB.");
        }

        const dispositivo = await servicoDevice.associar(req.params.id as string, empilhadeiraId || null, filtroPorFilial(req.escopo));
        return respostaSucesso(res, StatusCode.OK, dispositivo.obterDados());
    } catch (error: any) {
        if (error.message.includes("não encontrado")) {
            return respostaErro(res, StatusCode.NOT_FOUND, error.message);
        }
        return responderErro(res, error);
    }
}

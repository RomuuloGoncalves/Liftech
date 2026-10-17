import { describe, test, expect, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { criar, renomear, excluir } from '../../src/feature/branch/branchService.js';
import { ErroHttp } from '../../src/utils/responseHandler.js';
import { Branch } from '../../src/schemas/branch.js';
import { Forklift } from '../../src/schemas/forklift.js';
import { Device } from '../../src/schemas/device.js';
import { Operator } from '../../src/schemas/operator.js';
import { Incident } from '../../src/schemas/incident.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/schemas/branch.js', () => ({ Branch: { create: vi.fn(), findOneAndUpdate: vi.fn(), findOne: vi.fn(), deleteOne: vi.fn() } }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: { exists: vi.fn() } }));
vi.mock('../../src/schemas/device.js', () => ({ Device: { exists: vi.fn() } }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: { exists: vi.fn() } }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: { exists: vi.fn() } }));

const EMPRESA = new mongoose.Types.ObjectId().toHexString();
const ID = new mongoose.Types.ObjectId().toHexString();
const escopo: Escopo = { empresaId: EMPRESA, tipo: 'empresa', filiais: [] };
const RECURSOS = { Forklift, Device, Operator, Incident } as const;

const mockarLean = (valor: unknown) => ({ lean: vi.fn().mockResolvedValue(valor) }) as any;

describe('branchService.criar', () => {
    beforeEach(() => vi.clearAllMocks());

    test('grava só nome e empresaId do chamador e devolve { _id, nome, matriz: false }', async () => {
        vi.mocked(Branch.create).mockResolvedValue({ _id: ID, nome: 'Unidade Sul', matriz: false } as any);

        const filial = await criar(escopo, 'Unidade Sul');

        expect(Branch.create).toHaveBeenCalledWith({ nome: 'Unidade Sul', empresaId: EMPRESA });
        expect(filial).toEqual({ _id: ID, nome: 'Unidade Sul', matriz: false });
    });

    test('nome repetido na empresa (11000) vira ErroHttp 409', async () => {
        vi.mocked(Branch.create).mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 }));

        await expect(criar(escopo, 'Matriz')).rejects.toMatchObject({ status: 409 });
    });

    test('outro erro do banco se propaga sem virar ErroHttp', async () => {
        vi.mocked(Branch.create).mockRejectedValue(new Error('falha de conexão'));

        const erro = await criar(escopo, 'X').catch((e) => e);

        expect(erro).not.toBeInstanceOf(ErroHttp);
        expect(erro.message).toBe('falha de conexão');
    });
});

describe('branchService.renomear', () => {
    beforeEach(() => vi.clearAllMocks());

    test('atualiza só o nome na filial da empresa e devolve { _id, nome, matriz }', async () => {
        vi.mocked(Branch.findOneAndUpdate).mockReturnValue(mockarLean({ _id: ID, nome: 'Unidade Leste', matriz: true }));

        const filial = await renomear(escopo, ID, 'Unidade Leste');

        expect(Branch.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: ID, empresaId: EMPRESA },
            { nome: 'Unidade Leste' },
            expect.objectContaining({ returnDocument: 'after' })
        );
        expect(filial).toEqual({ _id: ID, nome: 'Unidade Leste', matriz: true });
    });

    test('filial inexistente ou de outra empresa: ErroHttp 404', async () => {
        vi.mocked(Branch.findOneAndUpdate).mockReturnValue(mockarLean(null));

        await expect(renomear(escopo, ID, 'X')).rejects.toMatchObject({ status: 404 });
    });

    test('nome repetido na empresa (11000): ErroHttp 409', async () => {
        vi.mocked(Branch.findOneAndUpdate).mockReturnValue({
            lean: vi.fn().mockRejectedValue(Object.assign(new Error('E11000'), { code: 11000 })),
        } as any);

        await expect(renomear(escopo, ID, 'Matriz')).rejects.toMatchObject({ status: 409 });
    });
});

describe('branchService.excluir', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(Branch.findOne).mockReturnValue(mockarLean({ _id: ID, nome: 'Unidade Sul', matriz: false }));
        for (const m of Object.values(RECURSOS)) vi.mocked(m.exists).mockResolvedValue(null as any);
    });

    test('sem vínculos: apaga e devolve { _id, message }', async () => {
        const resposta = await excluir(escopo, ID);

        expect(Branch.findOne).toHaveBeenCalledWith({ _id: ID, empresaId: EMPRESA });
        for (const m of Object.values(RECURSOS)) expect(m.exists).toHaveBeenCalledWith({ filialId: ID });
        expect(Branch.deleteOne).toHaveBeenCalledWith({ _id: ID });
        expect(resposta).toEqual({ _id: ID, message: 'Filial excluída com sucesso.' });
    });

    test('filial inexistente ou de outra empresa: ErroHttp 404 e nada é apagado', async () => {
        vi.mocked(Branch.findOne).mockReturnValue(mockarLean(null));

        await expect(excluir(escopo, ID)).rejects.toMatchObject({ status: 404 });
        expect(Branch.deleteOne).not.toHaveBeenCalled();
    });

    test('matriz: ErroHttp 409 e nada é apagado', async () => {
        vi.mocked(Branch.findOne).mockReturnValue(mockarLean({ _id: ID, nome: 'Matriz', matriz: true }));

        await expect(excluir(escopo, ID)).rejects.toMatchObject({ status: 409 });
        expect(Branch.deleteOne).not.toHaveBeenCalled();
    });

    test.each(Object.keys(RECURSOS) as (keyof typeof RECURSOS)[])('com %s vinculado: ErroHttp 409 e nada é apagado', async (nome) => {
        vi.mocked(RECURSOS[nome].exists).mockResolvedValue({ _id: 'x' } as any);

        await expect(excluir(escopo, ID)).rejects.toMatchObject({ status: 409 });
        expect(Branch.deleteOne).not.toHaveBeenCalled();
    });

    test('erro do banco se propaga sem virar ErroHttp', async () => {
        vi.mocked(Branch.findOne).mockReturnValue({ lean: vi.fn().mockRejectedValue(new Error('falha de conexão')) } as any);

        const erro = await excluir(escopo, ID).catch((e) => e);

        expect(erro).not.toBeInstanceOf(ErroHttp);
    });
});

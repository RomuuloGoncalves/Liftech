import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { BranchRepository } from '../../src/feature/branch/branchRepository.js';
import { OperatorRepository } from '../../src/feature/operator/operatorRepository.js';
import { IncidentRepository } from '../../src/feature/incident/incidentRepository.js';
import { branchModel } from '../../src/models/branchModel.js';
import { operatorModel } from '../../src/models/operatorModel.js';
import { incidentModel } from '../../src/models/incidentModel.js';

const comDocumentos = (documentos: unknown[]) => ({ find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(documentos) }) }) as any;

describe('BranchRepository', () => {
    test('criar sem matriz grava só nome e empresaId', async () => {
        const create = vi.fn().mockResolvedValue({ _id: 'b1', nome: 'Sul', matriz: false });

        await new BranchRepository({ create } as any).criar(new branchModel('Sul', 'e1'));

        expect(create).toHaveBeenCalledWith({ nome: 'Sul', empresaId: 'e1' });
    });

    test('converte o documento com matriz', async () => {
        const id = new Types.ObjectId();
        const [filial] = await new BranchRepository(comDocumentos([{ _id: id, nome: 'Matriz', empresaId: 'e1', matriz: true }])).obterTodos();

        expect(filial).toBeInstanceOf(branchModel);
        expect(filial!.getID()).toBe(String(id));
        expect(filial!.getMatriz()).toBe(true);
    });
});

describe('OperatorRepository', () => {
    test('criar grava os dados como vieram, com as referências sem conversão', async () => {
        const filialId = new Types.ObjectId();
        const create = vi.fn().mockResolvedValue({ _id: 'o1' });

        await new OperatorRepository({ create } as any).criar(new operatorModel({ nome: 'Ana', matricula: 'EMP-001', filialId }));

        expect(create).toHaveBeenCalledWith({ nome: 'Ana', matricula: 'EMP-001', filialId });
        expect(create.mock.calls[0]![0].filialId).toBe(filialId);
    });

    test('converte só os campos presentes no documento', async () => {
        const id = new Types.ObjectId();
        const [operador] = await new OperatorRepository(comDocumentos([{ _id: id, nome: 'Ana', filialId: 'f1', __v: 0 }])).obterTodos();

        expect(operador).toBeInstanceOf(operatorModel);
        expect(operador!.obterDados()).toEqual({ _id: id, nome: 'Ana', filialId: 'f1' });
        expect(operador!.getID()).toBe(String(id));
        expect(operador!.getIdOriginal()).toBe(id);
    });
});

describe('IncidentRepository', () => {
    test('criar grava os dados como vieram', async () => {
        const empilhadeiraId = new Types.ObjectId();
        const data = new Date('2026-10-15T09:30:00Z');
        const create = vi.fn().mockResolvedValue({ _id: 'i1' });

        await new IncidentRepository({ create } as any).criar(new incidentModel({ empilhadeiraId, dataIncidente: data, status: 'pendente', origem: 'sensor' }));

        expect(create).toHaveBeenCalledWith({ empilhadeiraId, dataIncidente: data, status: 'pendente', origem: 'sensor' });
    });

    test('converte só os campos presentes no documento', async () => {
        const id = new Types.ObjectId();
        const [incidente] = await new IncidentRepository(comDocumentos([{ _id: id, status: 'resolvido', filialId: 'f1' }])).obterTodos();

        expect(incidente).toBeInstanceOf(incidentModel);
        expect(incidente!.getDados()).toEqual({ status: 'resolvido', filialId: 'f1' });
        expect(incidente!.getIdOriginal()).toBe(id);
    });
});

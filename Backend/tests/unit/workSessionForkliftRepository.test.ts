import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { WorkSessionRepository } from '../../src/feature/session/workSessionRepository.js';
import { ForkliftRepository } from '../../src/feature/forklift/forkliftRepository.js';
import { workSessionModel } from '../../src/models/workSessionModel.js';

const comDocumentos = (documentos: unknown[]) => ({ find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(documentos) }) }) as any;

describe('WorkSessionRepository', () => {
    test('criar grava a sessão como veio', async () => {
        const inicio = new Date('2026-10-15T12:00:00Z');
        const create = vi.fn().mockResolvedValue({ _id: 's1' });

        await new WorkSessionRepository({ create } as any).criar(new workSessionModel({ operadorId: 'o1', empilhadeiraId: 'm1', filialId: 'f1', inicio }));

        expect(create).toHaveBeenCalledWith({ operadorId: 'o1', empilhadeiraId: 'm1', filialId: 'f1', inicio });
    });

    test('converte só os campos da sessão e guarda o _id original', async () => {
        const id = new Types.ObjectId();
        const [sessao] = await new WorkSessionRepository(comDocumentos([{ _id: id, operadorId: 'o1', empilhadeiraId: 'm1', fim: null, __v: 0 }])).obterTodos();

        expect(sessao!.getIdOriginal()).toBe(id);
        expect(sessao!.getID()).toBe(String(id));
        expect(sessao!.getDados()).toEqual({ operadorId: 'o1', empilhadeiraId: 'm1', fim: null });
    });
});

describe('ForkliftRepository: documento da máquina', () => {
    test('o modelo guarda o documento inteiro sem mudar o obterDados de /api/forklifts', async () => {
        const id = new Types.ObjectId();
        const documento = { _id: id, identificacao: 'EMP-081', nome: 'Titan', status: 'alerta', setorId: 's1', filialId: 'f1' };

        const [maquina] = await new ForkliftRepository(comDocumentos([documento])).obterTodos();

        expect(maquina!.getDocumento()).toBe(documento);
        expect(maquina!.getIdOriginal()).toBe(id);
        expect(maquina!.obterDados()).toEqual({ _id: String(id), id: 'EMP-081', filialId: 'f1' });
    });
});

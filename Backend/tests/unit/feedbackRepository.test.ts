import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { FeedbackRepository } from '../../src/feature/feedback/feedbackRepository.js';
import { feedbackModel } from '../../src/models/feedbackModel.js';

const CRIADO_EM = new Date('2026-10-23T12:00:00.000Z');

describe('FeedbackRepository', () => {
    test('criar grava só mensagem, usuarioId, empresaId e role, sem _id nem criadoEm', async () => {
        const create = vi.fn().mockResolvedValue({ _id: 'f1', criadoEm: CRIADO_EM });
        const repositorio = new FeedbackRepository({ create } as any);

        await repositorio.criar(new feedbackModel('Ótimo', 'u1', 'e1', 'admin'));

        expect(create).toHaveBeenCalledWith({ mensagem: 'Ótimo', usuarioId: 'u1', empresaId: 'e1', role: 'admin' });
    });

    test('converte o documento: ids em texto e criadoEm em Date', async () => {
        const id = new Types.ObjectId();
        const usuarioId = new Types.ObjectId();
        const empresaId = new Types.ObjectId();
        const create = vi.fn().mockResolvedValue({
            toObject: () => ({ _id: id, mensagem: 'Ótimo', usuarioId, empresaId, role: 'colaborador', criadoEm: CRIADO_EM.toISOString() }),
        });

        const criado = await new FeedbackRepository({ create } as any).criar(new feedbackModel('Ótimo', String(usuarioId), String(empresaId), 'colaborador'));

        expect(criado!.getID()).toBe(String(id));
        expect(criado!.getCriadoEm()).toEqual(CRIADO_EM);
        expect(criado!.obterDados()).toEqual({
            _id: String(id), mensagem: 'Ótimo', usuarioId: String(usuarioId), empresaId: String(empresaId), role: 'colaborador', criadoEm: CRIADO_EM,
        });
    });

    test('sem empresa no documento, empresaId é null', async () => {
        const create = vi.fn().mockResolvedValue({ _id: 'f1', mensagem: 'x', usuarioId: 'u1', empresaId: null, role: 'admin', criadoEm: CRIADO_EM });

        const criado = await new FeedbackRepository({ create } as any).criar(new feedbackModel('x', 'u1', null, 'admin'));

        expect(criado!.obterDados()).toMatchObject({ empresaId: null });
    });
});

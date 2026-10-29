import { describe, test, expect, vi } from 'vitest';
import { Types } from 'mongoose';
import { AccessRequestRepository } from '../../src/feature/accessRequest/accessRequestRepository.js';
import { accessRequestModel } from '../../src/models/accessRequestModel.js';
import { UserRepository } from '../../src/feature/user/userRepository.js';

describe('AccessRequestRepository', () => {
    test('o modelo devolve o documento inteiro, como foi gravado', async () => {
        const documento = {
            _id: new Types.ObjectId(), email: 'ana@x.com', nomeEmpresa: 'Acme', nomeAdministrador: 'Ana', status: 'pendente',
            createdAt: new Date('2026-10-20T10:00:00Z'), updatedAt: new Date('2026-10-20T10:00:00Z'), __v: 0,
        };
        const find = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([documento]) });

        const [solicitacao] = await new AccessRequestRepository({ find } as any).obterTodos();

        expect(solicitacao).toBeInstanceOf(accessRequestModel);
        expect(solicitacao!.obterDados()).toEqual(documento);
        expect(solicitacao!.getID()).toBe(String(documento._id));
        expect(solicitacao!.getNomeEmpresa()).toBe('Acme');
    });

    test('criar grava só os campos do pedido', async () => {
        const create = vi.fn().mockResolvedValue({ toObject: () => ({ _id: 'a1', email: 'ana@x.com' }) });

        await new AccessRequestRepository({ create } as any).criar(new accessRequestModel({ email: 'ana@x.com', nomeEmpresa: 'Acme', nomeAdministrador: 'Ana' }));

        expect(create).toHaveBeenCalledWith({ email: 'ana@x.com', nomeEmpresa: 'Acme', nomeAdministrador: 'Ana' });
    });
});

describe('UserRepository.criarComCredenciais', () => {
    test('grava os dados de login como vieram e devolve o modelo sem expor a senha no obterDados', async () => {
        const id = new Types.ObjectId();
        const dados = { nome: 'Ana', email: 'ana@x.com', role: 'admin', escopo: 'empresa', empresaId: 'e1', senhaHash: 'h' };
        const create = vi.fn().mockResolvedValue({ toObject: () => ({ _id: id, ...dados }) });

        const usuario = await new UserRepository({ create } as any).criarComCredenciais(dados);

        expect(create).toHaveBeenCalledWith(dados);
        expect(usuario.getID()).toBe(String(id));
        expect(usuario.getSenhaHash()).toBe('h');
        expect(usuario.obterDados()).not.toHaveProperty('senhaHash');
    });
});

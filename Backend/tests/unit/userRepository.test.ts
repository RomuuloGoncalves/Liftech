import { describe, test, expect, vi } from 'vitest';
import { UserRepository } from '../../src/feature/user/userRepository.js';

const ID = '665f1c2b9a1e4b0012345678';

function repositorioCom(documentos: Record<string, unknown>[]) {
    const bd = { find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(documentos) }) };
    return new UserRepository(bd as any);
}

describe('UserRepository.converterParaModelo', () => {
    test('documento com telefone e cargo: o modelo devolve os dois', async () => {
        const repo = repositorioCom([
            { _id: ID, nome: 'Bruno', role: 'colaborador', telefone: '+55 99 99999999', cargo: 'Operador' },
        ]);

        const [usuario] = await repo.obterTodos();

        expect(usuario!.obterDados()).toEqual({
            _id: ID,
            nome: 'Bruno',
            role: 'colaborador',
            telefone: '+55 99 99999999',
            cargo: 'Operador',
        });
    });

    test('documento antigo sem telefone nem cargo: converte sem erro e sem os campos', async () => {
        const repo = repositorioCom([{ _id: ID, nome: 'Ana', role: 'admin' }]);

        const [usuario] = await repo.obterTodos();

        expect(usuario!.obterDados()).toEqual({ _id: ID, nome: 'Ana', role: 'admin' });
    });
});

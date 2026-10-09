import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { seedAdmin } from '../../src/scripts/seedAdmin.js';
import { User } from '../../src/schemas/user.js';
import { verificarSenha } from '../../src/utils/senha.js';

vi.mock('../../src/schemas/user.js', () => ({ User: { findOne: vi.fn(), create: vi.fn() } }));
vi.mock('../../src/config/conn.js', () => ({ conn: { mongoose: { disconnect: vi.fn() } } }));

const VARIAVEIS = ['SEED_ADMIN_EMAIL', 'SEED_ADMIN_SENHA', 'SEED_ADMIN_NOME'] as const;
const envOriginal = { ...process.env };

function mockarBusca(documento: Record<string, unknown> | null) {
    vi.mocked(User.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(documento) } as any);
}

describe('seedAdmin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.SEED_ADMIN_EMAIL = '  Admin@Empresa.COM ';
        process.env.SEED_ADMIN_SENHA = 'segredo1';
        process.env.SEED_ADMIN_NOME = 'Administrador';
    });

    afterEach(() => {
        process.env = { ...envOriginal };
    });

    test('email não encontrado: cria admin com email normalizado e senha com hash', async () => {
        mockarBusca(null);

        await seedAdmin();

        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@empresa.com' });
        expect(User.create).toHaveBeenCalledTimes(1);
        const criado = vi.mocked(User.create).mock.calls[0]![0] as any;
        expect(criado).toMatchObject({ nome: 'Administrador', email: 'admin@empresa.com', role: 'admin' });
        expect(criado.senhaHash).not.toBe('segredo1');
        expect(verificarSenha('segredo1', criado.senhaHash)).toBe(true);
    });

    test('usuário já existe: não cria', async () => {
        mockarBusca({ _id: '1', email: 'admin@empresa.com' });
        await seedAdmin();
        expect(User.create).not.toHaveBeenCalled();
    });

    test.each(VARIAVEIS)('sem %s: não cria nem consulta o banco', async (variavel) => {
        delete process.env[variavel];
        await seedAdmin();
        expect(User.findOne).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
    });
});

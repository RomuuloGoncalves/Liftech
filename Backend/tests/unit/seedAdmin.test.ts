import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { seedAdmin } from '../../src/scripts/seedAdmin.js';
import { User } from '../../src/schemas/user.js';
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';
import { verificarSenha } from '../../src/utils/senha.js';

vi.mock('../../src/schemas/user.js', () => ({ User: { findOne: vi.fn(), create: vi.fn(), updateOne: vi.fn() } }));
vi.mock('../../src/schemas/company.js', () => ({ Company: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/config/conn.js', () => ({ conn: { mongoose: { disconnect: vi.fn() } } }));

const envOriginal = { ...process.env };

function mockarBusca(documento: Record<string, unknown> | null) {
    vi.mocked(User.findOne).mockReturnValue({ lean: vi.fn().mockResolvedValue(documento) } as any);
}

function mockarEmpresa() {
    for (const [nome, m] of Object.entries({ Company, Branch })) {
        vi.mocked(m.findOneAndUpdate).mockImplementation(((filtro: unknown) => ({
            lean: () => Promise.resolve({ _id: `${nome}:${JSON.stringify(filtro)}` }),
        })) as any);
    }
}

const EMPRESA_PADRAO = 'Company:{"nome":"Liftech Logística"}';

describe('seedAdmin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockarEmpresa();
    });

    afterEach(() => {
        process.env = { ...envOriginal };
    });

    test('admin@admin.com não encontrado: cria o admin fixo com a senha asdasdasd em hash', async () => {
        mockarBusca(null);

        await seedAdmin();

        expect(User.findOne).toHaveBeenCalledWith({ email: 'admin@admin.com' });
        expect(User.create).toHaveBeenCalledTimes(1);
        const criado = vi.mocked(User.create).mock.calls[0]![0] as any;
        expect(criado).toMatchObject({ nome: 'Administrador', email: 'admin@admin.com', role: 'admin' });
        expect(criado.senhaHash).not.toBe('asdasdasd');
        expect(verificarSenha('asdasdasd', criado.senhaHash)).toBe(true);
    });

    test('ignora as antigas variáveis SEED_ADMIN_*: as credenciais são fixas', async () => {
        process.env.SEED_ADMIN_EMAIL = 'outro@empresa.com';
        process.env.SEED_ADMIN_SENHA = 'outra-senha';
        mockarBusca(null);

        await seedAdmin();

        const criado = vi.mocked(User.create).mock.calls[0]![0] as any;
        expect(criado.email).toBe('admin@admin.com');
        expect(verificarSenha('asdasdasd', criado.senhaHash)).toBe(true);
    });

    test('usuário já existe: não cria', async () => {
        mockarBusca({ _id: '1', email: 'admin@admin.com' });
        await seedAdmin();
        expect(User.create).not.toHaveBeenCalled();
    });

    test('com empresaId: o admin novo nasce com empresaId e escopo empresa, sem garantir a empresa de novo', async () => {
        mockarBusca(null);

        await seedAdmin('empresa-1');

        expect(vi.mocked(User.create).mock.calls[0]![0]).toMatchObject({ role: 'admin', empresaId: 'empresa-1', escopo: 'empresa' });
        expect(Company.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test('admin que já existe: atualiza empresaId, escopo empresa e volta a senha para asdasdasd, sem recriar', async () => {
        mockarBusca({ _id: '1', email: 'admin@admin.com' });

        await seedAdmin('empresa-1');

        const [filtro, atualizacao] = vi.mocked(User.updateOne).mock.calls[0]! as any[];
        expect(filtro).toEqual({ email: 'admin@admin.com' });
        expect(atualizacao.$set).toMatchObject({ empresaId: 'empresa-1', escopo: 'empresa' });
        expect(Object.keys(atualizacao.$set).sort()).toEqual(['empresaId', 'escopo', 'senhaHash']);
        expect(verificarSenha('asdasdasd', atualizacao.$set.senhaHash)).toBe(true);
        expect(User.create).not.toHaveBeenCalled();
    });

    test('sem empresaId: garante a empresa padrão e a matriz e usa o id da empresa no admin', async () => {
        mockarBusca(null);

        await seedAdmin();

        expect(Company.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(Branch.findOneAndUpdate).toHaveBeenCalledTimes(1);
        expect(vi.mocked(User.create).mock.calls[0]![0]).toMatchObject({ empresaId: EMPRESA_PADRAO, escopo: 'empresa' });
    });
});

import { describe, test, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { login } from '../../src/feature/auth/authService.js';
import { User } from '../../src/schemas/user.js';
import { Company } from '../../src/schemas/company.js';
import { Branch } from '../../src/schemas/branch.js';
import { Operator } from '../../src/schemas/operator.js';
import { env } from '../../src/config/env.js';
import { gerarHashSenha } from '../../src/utils/senha.js';

vi.mock('../../src/schemas/user.js', () => ({ User: { findOne: vi.fn() } }));
vi.mock('../../src/schemas/company.js', () => ({ Company: { findById: vi.fn() } }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: { find: vi.fn() } }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: { findById: vi.fn() } }));

const SEGREDO = 'segredo-de-teste';
const ID = '665f1c2b9a1e4b0012345678';
const EMPRESA = '665f1c2b9a1e4b00123456a0';
const MATRIZ = '665f1c2b9a1e4b00123456b1';
const CENTRO = '665f1c2b9a1e4b00123456b2';

function mockarEmpresa(nome: string | null, filiais: unknown[]) {
    vi.mocked(Company.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(nome && { _id: EMPRESA, nome }) } as any);
    const sort = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(filiais) });
    vi.mocked(Branch.find).mockReturnValue({ sort } as any);
}

function mockarBusca(documento: Record<string, unknown> | null) {
    const lean = vi.fn().mockResolvedValue(documento);
    const select = vi.fn().mockReturnValue({ lean });
    vi.mocked(User.findOne).mockReturnValue({ select } as any);
    return { select };
}

describe('authService.login', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        env.jwt_secret = SEGREDO;
        env.jwt_expires_in = '8h';
    });

    test('admin com senha correta: retorna token e user sem senhaHash', async () => {
        const { select } = mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', email: 'ana@empresa.com', senhaHash: gerarHashSenha('segredo1') });

        const resultado = await login('admin', 'ana@empresa.com', 'segredo1');

        expect(User.findOne).toHaveBeenCalledWith({ role: 'admin', email: 'ana@empresa.com' });
        expect(select).toHaveBeenCalledWith('+senhaHash');
        expect(resultado.user).toEqual({ _id: ID, nome: 'Ana', role: 'admin', empresa: null, escopo: 'filiais', filiais: [], operador: null });
        expect(resultado).not.toHaveProperty('user.senhaHash');
        const payload = jwt.verify(resultado.token, SEGREDO) as jwt.JwtPayload;
        expect(payload.sub).toBe(ID);
        expect(payload.role).toBe('admin');
    });

    test('colaborador com senha correta: busca por usuario e retorna role colaborador', async () => {
        mockarBusca({ _id: ID, nome: 'Bruno', role: 'colaborador', usuario: 'bruno.op', senhaHash: gerarHashSenha('segredo2') });

        const resultado = await login('colaborador', 'bruno.op', 'segredo2');

        expect(User.findOne).toHaveBeenCalledWith({ role: 'colaborador', usuario: 'bruno.op' });
        expect(resultado.user).toEqual({ _id: ID, nome: 'Bruno', role: 'colaborador', empresa: null, escopo: 'filiais', filiais: [], operador: null });
        expect((jwt.verify(resultado.token, SEGREDO) as jwt.JwtPayload).role).toBe('colaborador');
    });

    test('colaborador com telefone e cargo: o user da resposta traz os dois', async () => {
        mockarBusca({ _id: ID, nome: 'Bruno', role: 'colaborador', usuario: 'bruno.op', telefone: '+55 99 99999999', cargo: 'Operador', senhaHash: gerarHashSenha('segredo2') });

        const resultado = await login('colaborador', 'bruno.op', 'segredo2');

        expect(resultado.user).toMatchObject({ _id: ID, nome: 'Bruno', role: 'colaborador', telefone: '+55 99 99999999', cargo: 'Operador' });
    });

    test('usuário sem telefone nem cargo: login funciona e o user (serializado) não tem os campos', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', email: 'ana@empresa.com', senhaHash: gerarHashSenha('segredo1') });

        const resultado = await login('admin', 'ana@empresa.com', 'segredo1');

        expect(Object.keys(JSON.parse(JSON.stringify(resultado.user)))).toEqual(['_id', 'nome', 'role', 'empresa', 'escopo', 'filiais', 'operador']);
    });

    test('admin de escopo empresa: user traz empresa, escopo e todas as filiais', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', empresaId: EMPRESA, escopo: 'empresa', filiaisIds: [], senhaHash: gerarHashSenha('segredo1') });
        mockarEmpresa('Liftech Logística', [{ _id: MATRIZ, nome: 'Matriz', matriz: true }, { _id: CENTRO, nome: 'Unidade Centro', matriz: false }]);

        const { user } = await login('admin', 'ana@empresa.com', 'segredo1');

        expect(Company.findById).toHaveBeenCalledWith(EMPRESA);
        expect(user).toEqual({
            _id: ID,
            nome: 'Ana',
            role: 'admin',
            empresa: { _id: EMPRESA, nome: 'Liftech Logística' },
            escopo: 'empresa',
            filiais: [{ _id: MATRIZ, nome: 'Matriz', matriz: true }, { _id: CENTRO, nome: 'Unidade Centro', matriz: false }],
            operador: null,
        });
    });

    test('colaborador com uma filial: user traz só essa filial e escopo filiais', async () => {
        mockarBusca({ _id: ID, nome: 'Bruno', role: 'colaborador', empresaId: EMPRESA, escopo: 'filiais', filiaisIds: [CENTRO], senhaHash: gerarHashSenha('segredo2') });
        mockarEmpresa('Liftech Logística', [{ _id: CENTRO, nome: 'Unidade Centro', matriz: false }]);

        const { user } = await login('colaborador', 'bruno.op', 'segredo2');

        expect(user.escopo).toBe('filiais');
        expect(user.filiais).toEqual([{ _id: CENTRO, nome: 'Unidade Centro', matriz: false }]);
        expect(user.empresa).toEqual({ _id: EMPRESA, nome: 'Liftech Logística' });
    });

    test('usuário sem empresaId: empresa null, escopo filiais, filiais vazio e nenhuma consulta de empresa ou filial', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', senhaHash: gerarHashSenha('segredo1') });

        const { user } = await login('admin', 'ana@empresa.com', 'segredo1');

        expect(user).toMatchObject({ empresa: null, escopo: 'filiais', filiais: [] });
        expect(Company.findById).not.toHaveBeenCalled();
        expect(Branch.find).not.toHaveBeenCalled();
    });

    test('o JWT só leva sub e role (mais iat e exp), sem dados de escopo', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', empresaId: EMPRESA, escopo: 'empresa', senhaHash: gerarHashSenha('segredo1') });
        mockarEmpresa('Liftech Logística', [{ _id: MATRIZ, nome: 'Matriz', matriz: true }]);

        const { token } = await login('admin', 'ana@empresa.com', 'segredo1');

        expect(Object.keys(jwt.verify(token, SEGREDO) as jwt.JwtPayload).sort()).toEqual(['exp', 'iat', 'role', 'sub']);
    });

    test('senha errada: lança "Credenciais inválidas."', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', senhaHash: gerarHashSenha('segredo1') });
        await expect(login('admin', 'ana@empresa.com', 'errada')).rejects.toThrow('Credenciais inválidas.');
    });

    test('login inexistente (ou de outro role): lança "Credenciais inválidas."', async () => {
        mockarBusca(null);
        await expect(login('colaborador', 'ninguem', 'qualquer')).rejects.toThrow('Credenciais inválidas.');
    });

    test('usuário sem senhaHash: lança "Credenciais inválidas."', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin' });
        await expect(login('admin', 'ana@empresa.com', 'qualquer')).rejects.toThrow('Credenciais inválidas.');
    });

    test('email com maiúsculas e espaços: normaliza antes de buscar', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', senhaHash: gerarHashSenha('segredo1') });
        await login('admin', '  Ana@Empresa.COM ', 'segredo1');
        expect(User.findOne).toHaveBeenCalledWith({ role: 'admin', email: 'ana@empresa.com' });
    });

    test('sem JWT_SECRET: lança erro de configuração e não consulta o banco', async () => {
        env.jwt_secret = undefined;
        await expect(login('admin', 'ana@empresa.com', 'segredo1')).rejects.toThrow('JWT_SECRET não configurado.');
        expect(User.findOne).not.toHaveBeenCalled();
    });

    test('colaborador ligado a um operator: user.operador traz _id e nome do operator', async () => {
        const OPERADOR = '665f1c2b9a1e4b00123456c1';
        mockarBusca({ _id: ID, nome: 'Bruno', role: 'colaborador', operadorId: OPERADOR, senhaHash: gerarHashSenha('segredo2') });
        vi.mocked(Operator.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: OPERADOR, nome: 'Carlos Silva' }) } as any);

        const { user } = await login('colaborador', 'bruno.op', 'segredo2');

        expect(Operator.findById).toHaveBeenCalledWith(OPERADOR);
        expect(user.operador).toEqual({ _id: OPERADOR, nome: 'Carlos Silva' });
    });

    test('colaborador com operadorId de operator apagado: operador null', async () => {
        mockarBusca({ _id: ID, nome: 'Bruno', role: 'colaborador', operadorId: '665f1c2b9a1e4b00123456c1', senhaHash: gerarHashSenha('segredo2') });
        vi.mocked(Operator.findById).mockReturnValue({ lean: vi.fn().mockResolvedValue(null) } as any);

        expect((await login('colaborador', 'bruno.op', 'segredo2')).user.operador).toBeNull();
    });

    test('admin: operador null sem consultar operator, mesmo com operadorId', async () => {
        mockarBusca({ _id: ID, nome: 'Ana', role: 'admin', operadorId: '665f1c2b9a1e4b00123456c1', senhaHash: gerarHashSenha('segredo1') });

        expect((await login('admin', 'ana@empresa.com', 'segredo1')).user.operador).toBeNull();
        expect(Operator.findById).not.toHaveBeenCalled();
    });
});

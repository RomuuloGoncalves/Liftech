import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { criar, atualizar, servicoUser } from '../../src/feature/user/userController.js';
import { userModel } from '../../src/models/userModel.js';

vi.mock('../../src/schemas/user.js', () => ({ User: {} }));

const ID = '665f1c2b9a1e4b0012345678';

describe('UserController telefone e cargo', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    beforeEach(() => {
        vi.restoreAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
    });

    describe('POST (criar)', () => {
        const chamar = (body: unknown) => criar({ body } as Request, res);
        // simula o banco: devolve o que recebeu, agora com _id
        const eco = () =>
            vi.spyOn(servicoUser, 'criar').mockImplementation(async (u) => {
                const d = u.obterDados() as Record<string, string | undefined>;
                return new userModel(u.getNome(), u.getRole(), ID, d.telefone, d.cargo);
            });

        test('201 grava e devolve telefone e cargo', async () => {
            const criarMock = eco();

            await chamar({ nome: 'Bruno', role: 'colaborador', telefone: '+55 99 99999999', cargo: 'Operador' });

            expect(criarMock.mock.calls[0]![0].obterDados()).toMatchObject({ telefone: '+55 99 99999999', cargo: 'Operador' });
            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({
                _id: ID,
                nome: 'Bruno',
                role: 'colaborador',
                telefone: '+55 99 99999999',
                cargo: 'Operador',
            });
        });

        test('201 sem telefone e cargo: resposta sem os campos', async () => {
            eco();

            await chamar({ nome: 'Bruno', role: 'colaborador' });

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(mockJson).toHaveBeenCalledWith({ _id: ID, nome: 'Bruno', role: 'colaborador' });
        });

        test.each([
            ['telefone', 123],
            ['cargo', { nome: 'Operador' }],
        ])('400 quando %s não é texto, sem chamar o serviço', async (campo, valor) => {
            const criarMock = eco();

            await chamar({ nome: 'Bruno', role: 'colaborador', [campo]: valor });

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(JSON.stringify(mockJson.mock.calls[0]![0])).toContain(`O campo '${campo}' deve ser texto válido.`);
            expect(criarMock).not.toHaveBeenCalled();
        });
    });

    describe('PUT (atualizar)', () => {
        const chamar = (body: unknown) => atualizar({ params: { id: ID }, body } as unknown as Request, res);

        test('200 repassa telefone ao serviço e devolve o valor atualizado', async () => {
            const atualizarMock = vi
                .spyOn(servicoUser, 'atualizar')
                .mockResolvedValue(new userModel('Bruno', 'colaborador', ID, '+55 11 98888-7777', 'Operador'));

            await chamar({ telefone: '+55 11 98888-7777' });

            expect(atualizarMock).toHaveBeenCalledWith(ID, { telefone: '+55 11 98888-7777' });
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson.mock.calls[0]![0]).toMatchObject({ telefone: '+55 11 98888-7777' });
        });

        test('200 repassa cargo ao serviço e devolve o valor atualizado', async () => {
            const atualizarMock = vi
                .spyOn(servicoUser, 'atualizar')
                .mockResolvedValue(new userModel('Bruno', 'colaborador', ID, undefined, 'Líder'));

            await chamar({ cargo: 'Líder' });

            expect(atualizarMock).toHaveBeenCalledWith(ID, { cargo: 'Líder' });
            expect(mockJson.mock.calls[0]![0]).toMatchObject({ cargo: 'Líder' });
        });

        test('400 quando telefone não é texto, sem chamar o serviço', async () => {
            const atualizarMock = vi.spyOn(servicoUser, 'atualizar');

            await chamar({ telefone: 99 });

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(JSON.stringify(mockJson.mock.calls[0]![0])).toContain("O campo 'telefone' deve ser texto válido.");
            expect(atualizarMock).not.toHaveBeenCalled();
        });

        test('PUT só com nome continua válido', async () => {
            const atualizarMock = vi.spyOn(servicoUser, 'atualizar').mockResolvedValue(new userModel('Novo', 'colaborador', ID));

            await chamar({ nome: 'Novo' });

            expect(atualizarMock).toHaveBeenCalledWith(ID, { nome: 'Novo' });
            expect(mockStatus).toHaveBeenCalledWith(200);
        });
    });
});

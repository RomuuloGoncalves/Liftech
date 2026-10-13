import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import { listar, buscar, criar, atualizar, deletar, servicoForklift } from '../../src/feature/forklift/forkliftController.js';
import { forkliftModel } from '../../src/models/forkliftModel.js';
import type { Escopo } from '../../src/core/escopo.js';

vi.mock('../../src/feature/forklift/forkliftService.js');
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: {} }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: {} }));

const F1 = '665f1c2b9a1e4b00123456b1';
const F2 = '665f1c2b9a1e4b00123456b2';
const FORA = '665f1c2b9a1e4b00123456b3';
const ID = '665f1c2b9a1e4b0012345678';
const filial = (_id: string) => ({ _id, nome: 'x', matriz: false });
const escopoDe = (tipo: 'empresa' | 'filiais', ids: string[]): Escopo => ({ empresaId: 'e1', tipo, filiais: ids.map(filial) });
const FILTRO = (ids: string[]) => ({ filialId: { $in: ids } });

describe('forkliftController: escopo', () => {
    let mockJson: ReturnType<typeof vi.fn>;
    let mockStatus: ReturnType<typeof vi.fn>;
    let res: Response;

    const req = (escopo: Escopo, extra: object = {}) => ({ escopo, params: {}, body: {}, ...extra }) as unknown as Request;
    const modeloEnviado = () => vi.mocked(servicoForklift.criar).mock.calls[0]![0].obterDados();

    beforeEach(() => {
        vi.clearAllMocks();
        mockJson = vi.fn();
        mockStatus = vi.fn().mockReturnValue({ json: mockJson });
        res = { status: mockStatus, json: mockJson } as unknown as Response;
        vi.mocked(servicoForklift.criar).mockImplementation(async (f: forkliftModel) => f);
    });

    describe('listar, buscar, deletar', () => {
        test('listar passa o filtro das filiais do escopo ao service', async () => {
            vi.mocked(servicoForklift.listar).mockResolvedValue([new forkliftModel('EMP-001', undefined, undefined, 'a', F1)]);

            await listar(req(escopoDe('filiais', [F1, F2])), res);

            expect(servicoForklift.listar).toHaveBeenCalledWith(FILTRO([F1, F2]));
            expect(mockStatus).toHaveBeenCalledWith(200);
            expect(mockJson).toHaveBeenCalledWith([expect.objectContaining({ id: 'EMP-001', filialId: F1 })]);
        });

        test('listar com escopo sem filiais passa $in vazio', async () => {
            vi.mocked(servicoForklift.listar).mockResolvedValue([]);

            await listar(req(escopoDe('filiais', [])), res);

            expect(servicoForklift.listar).toHaveBeenCalledWith(FILTRO([]));
        });

        test('buscar passa o id e o filtro; fora do escopo o service lança e vira 404', async () => {
            vi.mocked(servicoForklift.obterPorId).mockRejectedValue(new Error('Empilhadeira não encontrado(a).'));

            await buscar(req(escopoDe('filiais', [F1]), { params: { id: ID } }), res);

            expect(servicoForklift.obterPorId).toHaveBeenCalledWith(ID, FILTRO([F1]));
            expect(mockStatus).toHaveBeenCalledWith(404);
            expect(mockJson).toHaveBeenCalledWith({ error: 'Empilhadeira não encontrado(a).' });
        });

        test('deletar passa o id e o filtro; fora do escopo vira 404', async () => {
            vi.mocked(servicoForklift.deletar).mockRejectedValue(new Error('Empilhadeira não encontrado(a).'));

            await deletar(req(escopoDe('filiais', [F1]), { params: { id: ID } }), res);

            expect(servicoForklift.deletar).toHaveBeenCalledWith(ID, FILTRO([F1]));
            expect(mockStatus).toHaveBeenCalledWith(404);
        });
    });

    describe('criar', () => {
        test('201 e o service recebe o model com o filialId do corpo, quando está no escopo', async () => {
            await criar(req(escopoDe('filiais', [F1, F2]), { body: { id: 'EMP-001', filialId: F2 } }), res);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(modeloEnviado()).toMatchObject({ id: 'EMP-001', filialId: F2 });
            expect(mockJson).toHaveBeenCalledWith(modeloEnviado());
        });

        test('403 com filialId fora do escopo, sem criar', async () => {
            await criar(req(escopoDe('filiais', [F1]), { body: { id: 'EMP-001', filialId: FORA } }), res);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(servicoForklift.criar).not.toHaveBeenCalled();
        });

        test('400 com filialId que não é ObjectId', async () => {
            await criar(req(escopoDe('filiais', [F1]), { body: { id: 'EMP-001', filialId: 'abc' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(servicoForklift.criar).not.toHaveBeenCalled();
        });

        test('sem filialId e escopo filiais com uma filial: cria nessa filial', async () => {
            await criar(req(escopoDe('filiais', [F1]), { body: { id: 'EMP-001' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(201);
            expect(modeloEnviado()).toMatchObject({ filialId: F1 });
        });

        test.each([
            ['escopo empresa', escopoDe('empresa', [F1])],
            ['várias filiais', escopoDe('filiais', [F1, F2])],
            ['nenhuma filial', escopoDe('filiais', [])],
        ])('400 sem filialId com %s', async (_caso, escopo) => {
            await criar(req(escopo, { body: { id: 'EMP-001' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(servicoForklift.criar).not.toHaveBeenCalled();
        });

        test('id vazio continua sendo rejeitado no mesmo formato', async () => {
            await criar(req(escopoDe('filiais', [F1]), { body: { id: '', filialId: F1 } }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(mockJson).toHaveBeenCalledWith({ error: [{ field: 'id', message: 'This field is required!' }] });
        });
    });

    describe('atualizar', () => {
        const atualizada = new forkliftModel('EMP-001', undefined, undefined, ID, F2);

        beforeEach(() => {
            vi.mocked(servicoForklift.atualizar).mockResolvedValue(atualizada);
        });

        test('passa o id, o corpo e o filtro do escopo ao service', async () => {
            await atualizar(req(escopoDe('filiais', [F1]), { params: { id: ID }, body: { nome: 'Nova' } }), res);

            expect(servicoForklift.atualizar).toHaveBeenCalledWith(ID, { nome: 'Nova' }, FILTRO([F1]));
            expect(mockStatus).toHaveBeenCalledWith(200);
        });

        test('fora do escopo o service lança e vira 404', async () => {
            vi.mocked(servicoForklift.atualizar).mockRejectedValue(new Error('Empilhadeira não encontrado(a).'));

            await atualizar(req(escopoDe('filiais', [F1]), { params: { id: ID }, body: { nome: 'x' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(404);
        });

        test('escopo empresa move para uma filial do escopo', async () => {
            await atualizar(req(escopoDe('empresa', [F1, F2]), { params: { id: ID }, body: { filialId: F2 } }), res);

            expect(servicoForklift.atualizar).toHaveBeenCalledWith(ID, { filialId: F2 }, FILTRO([F1, F2]));
            expect(mockStatus).toHaveBeenCalledWith(200);
        });

        test('403 com filialId quando o chamador não é de empresa, sem chamar o service', async () => {
            await atualizar(req(escopoDe('filiais', [F1, F2]), { params: { id: ID }, body: { filialId: F2 } }), res);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(servicoForklift.atualizar).not.toHaveBeenCalled();
        });

        test('403 com filialId fora do escopo, mesmo para escopo empresa', async () => {
            await atualizar(req(escopoDe('empresa', [F1]), { params: { id: ID }, body: { filialId: FORA } }), res);

            expect(mockStatus).toHaveBeenCalledWith(403);
            expect(servicoForklift.atualizar).not.toHaveBeenCalled();
        });

        test('400 com filialId que não é ObjectId', async () => {
            await atualizar(req(escopoDe('empresa', [F1]), { params: { id: ID }, body: { filialId: 'abc' } }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(servicoForklift.atualizar).not.toHaveBeenCalled();
        });

        test.each(['$set', '$where'])('400 com a chave %s no corpo, sem chamar o service', async (chave) => {
            await atualizar(req(escopoDe('empresa', [F1]), { params: { id: ID }, body: { [chave]: { filialId: FORA } } }), res);

            expect(mockStatus).toHaveBeenCalledWith(400);
            expect(servicoForklift.atualizar).not.toHaveBeenCalled();
        });
    });
});

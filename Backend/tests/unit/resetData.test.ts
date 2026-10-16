import { describe, test, expect, vi, beforeEach } from 'vitest';
import { resetarBanco, COLECOES } from '../../src/scripts/resetData.js';
import { seedData } from '../../src/scripts/seedData.js';

const NOMES = ['company', 'branch', 'category', 'sector', 'operator', 'device', 'forklift', 'telemetry', 'incident', 'workSession', 'user', 'accessRequest'];

// Cada model é um mock que registra a ordem dos deleteMany; nada toca no banco.
const { ordem, mockModel } = vi.hoisted(() => {
    const ordem: string[] = [];
    const mockModel = (nome: string) => ({ nome, deleteMany: vi.fn(async (filtro: unknown) => { ordem.push(`${nome}:${JSON.stringify(filtro)}`); }) });
    return { ordem, mockModel };
});
vi.mock('../../src/schemas/company.js', () => ({ Company: mockModel('company') }));
vi.mock('../../src/schemas/branch.js', () => ({ Branch: mockModel('branch') }));
vi.mock('../../src/schemas/category.js', () => ({ Category: mockModel('category') }));
vi.mock('../../src/schemas/sector.js', () => ({ Sector: mockModel('sector') }));
vi.mock('../../src/schemas/operator.js', () => ({ Operator: mockModel('operator') }));
vi.mock('../../src/schemas/device.js', () => ({ Device: mockModel('device') }));
vi.mock('../../src/schemas/forklift.js', () => ({ Forklift: mockModel('forklift') }));
vi.mock('../../src/schemas/telemetry.js', () => ({ Telemetry: mockModel('telemetry') }));
vi.mock('../../src/schemas/incident.js', () => ({ Incident: mockModel('incident') }));
vi.mock('../../src/schemas/workSession.js', () => ({ WorkSession: mockModel('workSession') }));
vi.mock('../../src/schemas/user.js', () => ({ User: mockModel('user') }));
vi.mock('../../src/schemas/accessRequest.js', () => ({ AccessRequest: mockModel('accessRequest') }));
vi.mock('../../src/scripts/seedData.js', () => ({ seedData: vi.fn() }));

describe('resetarBanco', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        ordem.length = 0;
        vi.mocked(seedData).mockImplementation(async () => {
            ordem.push('seed');
            return { empresas: 1 } as any;
        });
    });

    test('limpa as 12 collections da aplicação, sector inclusive', () => {
        expect(COLECOES.map((m: any) => m.nome).sort()).toEqual([...NOMES].sort());
    });

    test('apaga todos os documentos de cada collection antes de rodar o seed, e devolve a contagem do seed', async () => {
        const contagem = await resetarBanco();

        expect(ordem.slice(0, -1).sort()).toEqual(NOMES.map((n) => `${n}:{}`).sort());
        expect(ordem.at(-1)).toBe('seed');
        expect(contagem).toEqual({ empresas: 1 });
    });

    test('se apagar falhar, não roda o seed e o erro sobe', async () => {
        vi.mocked((COLECOES[0] as any).deleteMany).mockRejectedValueOnce(new Error('falha no banco'));

        await expect(resetarBanco()).rejects.toThrow('falha no banco');
        expect(seedData).not.toHaveBeenCalled();
    });
});

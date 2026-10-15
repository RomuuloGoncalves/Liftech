// Dados de exemplo do seed, os mesmos do mock do front (Frontend/src/data/machines.ts e team.ts).

const TITAN = 'Empilhadeira Elétrica Titan-X';
const ATLAS = 'Empilhadeira a Combustão Atlas-S';

export const OPERADORES = [
    'Carlos Silva', 'Ana Souza', 'João Pereira', 'Marina Costa',
    'Rafael Lima', 'Beatriz Alves', 'Fernanda Dias', 'Alexandre Gomes',
];

interface EmpilhadeiraSeed {
    identificacao: string;
    nome: string;
    setor: string;
    enderecoMac: string;
    status: 'disponivel' | 'em_uso' | 'manutencao' | 'alerta' | 'offline';
    operador?: string;
    tempoSessaoMinutos: number;
}

export const EMPILHADEIRAS: EmpilhadeiraSeed[] = [
    { identificacao: 'EMP-081', nome: TITAN, setor: 'Expedição - Bloco B', enderecoMac: 'A2:C9:9B:1D:F7', status: 'alerta', operador: 'Carlos Silva', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-082', nome: TITAN, setor: 'Expedição - Bloco B', enderecoMac: 'A2:C9:9B:1D:F8', status: 'em_uso', operador: 'Ana Souza', tempoSessaoMinutos: 12 },
    { identificacao: 'EMP-083', nome: TITAN, setor: 'Recebimento - Bloco A', enderecoMac: 'A2:C9:9B:1D:F9', status: 'disponivel', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-084', nome: TITAN, setor: 'Expedição - Bloco B', enderecoMac: 'A2:C9:9B:1D:FA', status: 'manutencao', tempoSessaoMinutos: 5 },
    { identificacao: 'EMP-085', nome: ATLAS, setor: 'Armazenagem - Bloco C', enderecoMac: 'A2:C9:9B:1D:FB', status: 'alerta', operador: 'João Pereira', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-086', nome: TITAN, setor: 'Expedição - Bloco B', enderecoMac: 'A2:C9:9B:1D:FC', status: 'offline', tempoSessaoMinutos: 0 },
    { identificacao: 'EMP-087', nome: ATLAS, setor: 'Recebimento - Bloco A', enderecoMac: 'A2:C9:9B:1D:FD', status: 'em_uso', operador: 'Marina Costa', tempoSessaoMinutos: 47 },
    { identificacao: 'EMP-088', nome: TITAN, setor: 'Armazenagem - Bloco C', enderecoMac: 'A2:C9:9B:1D:FE', status: 'disponivel', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-089', nome: TITAN, setor: 'Expedição - Bloco B', enderecoMac: 'A2:C9:9B:1D:FF', status: 'alerta', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-090', nome: ATLAS, setor: 'Recebimento - Bloco A', enderecoMac: 'A2:C9:9B:1E:01', status: 'manutencao', tempoSessaoMinutos: 2 },
    { identificacao: 'EMP-091', nome: TITAN, setor: 'Armazenagem - Bloco C', enderecoMac: 'A2:C9:9B:1E:02', status: 'disponivel', operador: 'Rafael Lima', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-092', nome: TITAN, setor: 'Expedição - Bloco B', enderecoMac: 'A2:C9:9B:1E:03', status: 'em_uso', operador: 'Beatriz Alves', tempoSessaoMinutos: 21 },
    { identificacao: 'EMP-093', nome: ATLAS, setor: 'Recebimento - Bloco A', enderecoMac: 'A2:C9:9B:1E:04', status: 'disponivel', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-094', nome: TITAN, setor: 'Armazenagem - Bloco C', enderecoMac: 'A2:C9:9B:1E:05', status: 'offline', tempoSessaoMinutos: 0 },
    { identificacao: 'EMP-095', nome: TITAN, setor: 'Expedição - Bloco B', enderecoMac: 'A2:C9:9B:1E:06', status: 'disponivel', tempoSessaoMinutos: 34 },
    { identificacao: 'EMP-096', nome: ATLAS, setor: 'Recebimento - Bloco A', enderecoMac: 'A2:C9:9B:1E:07', status: 'disponivel', operador: 'Fernanda Dias', tempoSessaoMinutos: 34 },
];

// O dispositivo guarda só a conectividade; o status da máquina fica na empilhadeira.
export const DISPOSITIVOS = EMPILHADEIRAS.map(({ enderecoMac, status }) => ({ enderecoMac, status: status === 'offline' ? 'offline' : 'online' }));

// Sem senha aqui: a senha dos colaboradores vem de SEED_COLABORADOR_SENHA.
export const COLABORADORES = [
    { nome: 'Alexandre Mattos', usuario: 'AlexandreMattos' },
    { nome: 'Carlos Silva', usuario: 'CarlosSilva' },
    { nome: 'Ana Souza', usuario: 'AnaSouza' },
    { nome: 'João Pereira', usuario: 'JoaoPereira' },
    { nome: 'Marina Costa', usuario: 'MarinaCosta' },
    { nome: 'Rafael Lima', usuario: 'RafaelLima' },
    { nome: 'Beatriz Alves', usuario: 'BeatrizAlves' },
    { nome: 'Fernanda Dias', usuario: 'FernandaDias' },
    { nome: 'Paulo Nunes', usuario: 'PauloNunes' },
    { nome: 'Larissa Rocha', usuario: 'LarissaRocha' },
    { nome: 'Diego Martins', usuario: 'DiegoMartins' },
];

export const EMPRESA_NOME = 'Liftech Logística';
export const MATRIZ_NOME = 'Matriz';
export const FILIAIS_EXTRAS = ['Unidade Centro', 'Unidade Norte'];

// Cada bloco (setor) do mock vira uma filial.
const FILIAL_POR_SETOR: Record<string, string> = {
    'Expedição - Bloco B': MATRIZ_NOME,
    'Recebimento - Bloco A': 'Unidade Centro',
    'Armazenagem - Bloco C': 'Unidade Norte',
};

export const filialDaEmpilhadeira = (e: Pick<EmpilhadeiraSeed, 'setor'>) => FILIAL_POR_SETOR[e.setor] ?? MATRIZ_NOME;

// O dispositivo fica na filial da empilhadeira que o usa.
export const filialDoDispositivo = (enderecoMac: string) => {
    const e = EMPILHADEIRAS.find((x) => x.enderecoMac === enderecoMac);
    return e ? filialDaEmpilhadeira(e) : MATRIZ_NOME;
};

// O operador fica na filial da primeira empilhadeira que o cita; sem empilhadeira, na matriz.
export const filialDoOperador = (nome: string) => {
    const e = EMPILHADEIRAS.find((x) => x.operador === nome);
    return e ? filialDaEmpilhadeira(e) : MATRIZ_NOME;
};

// Filiais de cada colaborador (chave: usuario). PauloNunes tem duas, para testar o seletor.
export const FILIAIS_DOS_COLABORADORES: Record<string, string[]> = {
    AlexandreMattos: [MATRIZ_NOME],
    CarlosSilva: [MATRIZ_NOME],
    AnaSouza: [MATRIZ_NOME],
    JoaoPereira: ['Unidade Norte'],
    MarinaCosta: ['Unidade Centro'],
    RafaelLima: ['Unidade Norte'],
    BeatrizAlves: [MATRIZ_NOME],
    FernandaDias: ['Unidade Centro'],
    PauloNunes: ['Unidade Centro', 'Unidade Norte'],
    LarissaRocha: ['Unidade Centro'],
    DiegoMartins: ['Unidade Norte'],
};

export const SOLICITACOES = [
    { email: 'ana.prado@acmelogistica.com.br', nomeEmpresa: 'Acme Logística', nomeAdministrador: 'Ana Prado', status: 'pendente' },
    { email: 'carlos.teixeira@nortearmazens.com.br', nomeEmpresa: 'Norte Armazéns', nomeAdministrador: 'Carlos Teixeira', status: 'pendente' },
];

const HORA_MS = 3_600_000;
const DIA_MS = 24 * HORA_MS;
const PRIMEIRA_LEITURA = Date.UTC(2026, 8, 1, 8);
const PRIMEIRO_INCIDENTE = Date.UTC(2026, 7, 1, 10);

// Datas fixas (não relativas a "agora"): são a chave do upsert, então não mudam entre execuções.
export function gerarTelemetria(dispositivoId: string) {
    return Array.from({ length: 5 }, (_, i) => ({ dispositivoId, dataDados: new Date(PRIMEIRA_LEITURA + i * HORA_MS) }));
}

// Só a máquina em alerta tem incidente pendente (1 pendente + 1 resolvido); as outras, 2 resolvidos.
export function gerarIncidentes(empilhadeiraId: string, operadorId: string, indice: number, emAlerta = false) {
    return [0, 1].map((k) => ({
        empilhadeiraId,
        operadorId,
        dataIncidente: new Date(PRIMEIRO_INCIDENTE + (indice * 2 + k) * 2 * DIA_MS),
        forcaImpacto: 3 + ((indice * 2 + k * 3) % 7),
        status: emAlerta && k === 0 ? 'pendente' : 'resolvido',
    }));
}

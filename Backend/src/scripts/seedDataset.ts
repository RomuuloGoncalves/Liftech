// Dados de exemplo do seed, os mesmos do mock do front (Frontend/src/data/machines.ts e team.ts).

const TITAN = 'Empilhadeira Elétrica Titan-X';
const ATLAS = 'Empilhadeira a Combustão Atlas-S';

// Credenciais fixas de desenvolvimento: o reset deixa o banco sempre com estes acessos.
export const SENHA_PADRAO = 'asdasdasd';
export const ADMIN = { nome: 'Administrador', email: 'admin@admin.com' };

// Ficha de cada operador, a mesma da Equipe do Figma (Frontend/src/data/team.ts). A ordem dos 8 primeiros alimenta o operador de reserva dos incidentes.
export const FICHAS = [
    { nome: 'Carlos Silva', matricula: 'EMP-085', telefone: '(55) 15 988887777', cargo: 'Operador', horarioEntrada: '07:00', horarioSaida: '16:00' },
    { nome: 'Ana Souza', matricula: 'EMP-086', telefone: '(55) 15 977776666', cargo: 'Supervisora', horarioEntrada: '08:00', horarioSaida: '17:00' },
    { nome: 'João Pereira', matricula: 'EMP-087', telefone: '(55) 15 966665555', cargo: 'Operador', horarioEntrada: '14:00', horarioSaida: '22:00' },
    { nome: 'Marina Costa', matricula: 'EMP-088', telefone: '(55) 15 955554444', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00' },
    { nome: 'Rafael Lima', matricula: 'EMP-089', telefone: '(55) 15 944443333', cargo: 'Operador', horarioEntrada: '22:00', horarioSaida: '06:00' },
    { nome: 'Beatriz Alves', matricula: 'EMP-090', telefone: '(55) 15 933332222', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00' },
    { nome: 'Fernanda Dias', matricula: 'EMP-091', telefone: '(55) 15 922221111', cargo: 'Conferente', horarioEntrada: '09:00', horarioSaida: '18:00' },
    { nome: 'Alexandre Gomes', matricula: 'EMP-095', telefone: '(55) 15 977770000', cargo: 'Operador', horarioEntrada: '08:00', horarioSaida: '17:00' },
    { nome: 'Alexandre Mattos', matricula: 'EMP-084', telefone: '(55) 15 999999999', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00' },
    { nome: 'Paulo Nunes', matricula: 'EMP-092', telefone: '(55) 15 911110000', cargo: 'Operador', horarioEntrada: '07:00', horarioSaida: '16:00' },
    { nome: 'Larissa Rocha', matricula: 'EMP-093', telefone: '(55) 15 900009999', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00' },
    { nome: 'Diego Martins', matricula: 'EMP-094', telefone: '(55) 15 988880000', cargo: 'Conferente', horarioEntrada: '14:00', horarioSaida: '22:00' },
];

export const OPERADORES = FICHAS.map((f) => f.nome);

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
export const DISPOSITIVOS = EMPILHADEIRAS.map(({ enderecoMac, status }, i) => ({
    enderecoMac,
    nome: `Mpa-${5300 + i}`,
    status: status === 'offline' ? 'offline' : 'online',
}));

// Todos com SENHA_PADRAO. O acesso negado segue a Equipe do Figma; colaborador@colaborador.com é o login fixo de teste.
export const COLABORADORES = [
    { nome: 'Alexandre Mattos', usuario: 'AlexandreMattos' },
    { nome: 'Carlos Silva', usuario: 'CarlosSilva' },
    { nome: 'Ana Souza', usuario: 'AnaSouza' },
    { nome: 'João Pereira', usuario: 'JoaoPereira' },
    { nome: 'Marina Costa', usuario: 'MarinaCosta' },
    { nome: 'Rafael Lima', usuario: 'RafaelLima', acessoNegado: true },
    { nome: 'Beatriz Alves', usuario: 'BeatrizAlves', acessoNegado: true },
    { nome: 'Fernanda Dias', usuario: 'FernandaDias', acessoNegado: true },
    { nome: 'Paulo Nunes', usuario: 'PauloNunes', acessoNegado: true },
    { nome: 'Larissa Rocha', usuario: 'LarissaRocha', acessoNegado: true },
    { nome: 'Diego Martins', usuario: 'DiegoMartins', acessoNegado: true },
    { nome: 'Alexandre Gomes', usuario: 'colaborador@colaborador.com' },
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

// O operador fica na filial da primeira empilhadeira que o cita; sem empilhadeira, na primeira filial do seu login; sem login, na matriz.
export const filialDoOperador = (nome: string) => {
    const e = EMPILHADEIRAS.find((x) => x.operador === nome);
    if (e) return filialDaEmpilhadeira(e);
    const usuario = COLABORADORES.find((c) => c.nome === nome)?.usuario;
    return (usuario && FILIAIS_DOS_COLABORADORES[usuario]?.[0]) ?? MATRIZ_NOME;
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
    'colaborador@colaborador.com': [MATRIZ_NOME],
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

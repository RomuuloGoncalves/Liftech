export type MachineStatus = 'Disponível' | 'Em uso' | 'Manutenção' | 'Offline'

export const MACHINE_STATUSES: MachineStatus[] = ['Disponível', 'Em uso', 'Manutenção', 'Offline']

export interface Machine {
  id: string
  identificacao: string
  nome: string
  setor: string
  dispositivoConectado: {
    enderecoMac: string
    status: MachineStatus
  }
  operadorConectado?: {
    nome: string
  }
  tempoSessaoMinutos: number
}

export const MACHINES: Machine[] = [
  {
    id: '1',
    identificacao: 'EMP-081',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F7', status: 'Disponível' },
    operadorConectado: { nome: 'Carlos Silva' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '2',
    identificacao: 'EMP-082',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F8', status: 'Em uso' },
    operadorConectado: { nome: 'Ana Souza' },
    tempoSessaoMinutos: 12,
  },
  {
    id: '3',
    identificacao: 'EMP-083',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Recebimento - Bloco A',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F9', status: 'Disponível' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '4',
    identificacao: 'EMP-084',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:FA', status: 'Manutenção' },
    tempoSessaoMinutos: 5,
  },
  {
    id: '5',
    identificacao: 'EMP-085',
    nome: 'Empilhadeira a Combustão Atlas-S',
    setor: 'Armazenagem - Bloco C',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:FB', status: 'Disponível' },
    operadorConectado: { nome: 'João Pereira' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '6',
    identificacao: 'EMP-086',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:FC', status: 'Offline' },
    tempoSessaoMinutos: 0,
  },
  {
    id: '7',
    identificacao: 'EMP-087',
    nome: 'Empilhadeira a Combustão Atlas-S',
    setor: 'Recebimento - Bloco A',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:FD', status: 'Em uso' },
    operadorConectado: { nome: 'Marina Costa' },
    tempoSessaoMinutos: 47,
  },
  {
    id: '8',
    identificacao: 'EMP-088',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Armazenagem - Bloco C',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:FE', status: 'Disponível' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '9',
    identificacao: 'EMP-089',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:FF', status: 'Disponível' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '10',
    identificacao: 'EMP-090',
    nome: 'Empilhadeira a Combustão Atlas-S',
    setor: 'Recebimento - Bloco A',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1E:01', status: 'Manutenção' },
    tempoSessaoMinutos: 2,
  },
  {
    id: '11',
    identificacao: 'EMP-091',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Armazenagem - Bloco C',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1E:02', status: 'Disponível' },
    operadorConectado: { nome: 'Rafael Lima' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '12',
    identificacao: 'EMP-092',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1E:03', status: 'Em uso' },
    operadorConectado: { nome: 'Beatriz Alves' },
    tempoSessaoMinutos: 21,
  },
  {
    id: '13',
    identificacao: 'EMP-093',
    nome: 'Empilhadeira a Combustão Atlas-S',
    setor: 'Recebimento - Bloco A',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1E:04', status: 'Disponível' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '14',
    identificacao: 'EMP-094',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Armazenagem - Bloco C',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1E:05', status: 'Offline' },
    tempoSessaoMinutos: 0,
  },
  {
    id: '15',
    identificacao: 'EMP-095',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1E:06', status: 'Disponível' },
    tempoSessaoMinutos: 34,
  },
  {
    id: '16',
    identificacao: 'EMP-096',
    nome: 'Empilhadeira a Combustão Atlas-S',
    setor: 'Recebimento - Bloco A',
    dispositivoConectado: { enderecoMac: 'A2:C9:9B:1E:07', status: 'Disponível' },
    operadorConectado: { nome: 'Fernanda Dias' },
    tempoSessaoMinutos: 34,
  },
]

export interface MachineFilters {
  query?: string
  status?: MachineStatus | 'Todos'
}

export function filterMachines(machines: Machine[], filters: MachineFilters): Machine[] {
  const query = filters.query?.trim().toLowerCase() ?? ''
  const status = filters.status ?? 'Todos'

  return machines.filter((machine) => {
    const matchesQuery =
      query.length === 0 ||
      machine.identificacao.toLowerCase().includes(query) ||
      machine.setor.toLowerCase().includes(query)

    const matchesStatus = status === 'Todos' || machine.dispositivoConectado.status === status

    return matchesQuery && matchesStatus
  })
}

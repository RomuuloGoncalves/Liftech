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
    nomeDispositivo?: string
  }
  operadorConectado?: {
    nome: string
  }
  tempoSessaoMinutos: number
  tempoUsoTotalHoras?: number
}

const BASE_MACHINES: Machine[] = [
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

export const MACHINES: Machine[] = BASE_MACHINES.map((machine, index) => ({
  ...machine,
  dispositivoConectado: { ...machine.dispositivoConectado, nomeDispositivo: `Mpa-${5300 + index}` },
  tempoUsoTotalHoras: 4 + ((index * 3) % 20),
}))

export type MachineEventType = 'acidente' | 'manutencao'

export interface MachineEvent {
  id: string
  machineId: string
  tipo: MachineEventType
  operador: string
  data: string
  inicio: string
  fim: string
}

export const DEFAULT_PERIOD = { from: '2024-07-14', to: '2026-07-14' }

const EVENT_OPERATORS = ['Alexandre Gomes', 'Carlos Silva', 'Ana Souza', 'João Pereira', 'Marina Costa']
const EVENT_SLOTS = [
  ['14:35:25', '16:35:20'],
  ['08:10:00', '08:55:00'],
  ['09:00:00', '10:30:00'],
  ['13:15:30', '16:15:30'],
]
const EVENT_TYPES: MachineEventType[] = ['acidente', 'manutencao']
const FIRST_EVENT_DAY = Date.UTC(2024, 7, 1)
const DAY_MS = 24 * 60 * 60 * 1000

export const MACHINE_EVENTS: MachineEvent[] = BASE_MACHINES.flatMap((machine, machineIndex) =>
  EVENT_TYPES.flatMap((tipo, typeIndex) =>
    EVENT_SLOTS.map(([inicio, fim], slot) => {
      const dayOffset = (machineIndex * 7 + typeIndex * 11 + slot * 45) % 600
      return {
        id: `${machine.id}-${tipo}-${slot}`,
        machineId: machine.id,
        tipo,
        operador: EVENT_OPERATORS[(machineIndex + slot + typeIndex) % EVENT_OPERATORS.length],
        data: new Date(FIRST_EVENT_DAY + dayOffset * DAY_MS).toISOString().slice(0, 10),
        inicio,
        fim,
      }
    })
  )
)

export function eventsForMachine(machineId: string): MachineEvent[] {
  return MACHINE_EVENTS.filter((event) => event.machineId === machineId)
}

export interface EventFilters {
  tipo: MachineEventType
  from: string
  to: string
}

export function filterEvents(events: MachineEvent[], { tipo, from, to }: EventFilters): MachineEvent[] {
  if (from && to && from > to) return []

  return events
    .filter((event) => event.tipo === tipo && (!from || event.data >= from) && (!to || event.data <= to))
    .sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio))
}

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

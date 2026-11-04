import type { Incidente } from '../services/incidentService'

export type MachineStatus = 'disponivel' | 'em_uso' | 'manutencao' | 'alerta' | 'offline'

export const MACHINE_STATUSES: MachineStatus[] = ['disponivel', 'em_uso', 'manutencao', 'alerta', 'offline']

export interface Machine {
  id: string
  identificacao: string
  nome: string
  /** Name of the linked sector, '' without one. */
  setor: string
  setorId: string | null
  filialId?: string
  status: MachineStatus
  categoriaId: string | null
  categoriaTravada: boolean
  alertaEm?: string | null
  dispositivoConectado: {
    enderecoMac: string
    nomeDispositivo?: string
  }
  operadorConectado?: {
    nome: string
  }
  tempoSessaoMinutos: number
  /** Horas de uso somando todas as sessões da máquina. */
  tempoUsoTotalHoras?: number
  /** Horas de uso na semana atual (segunda a domingo). */
  tempoUsoSemanaHoras?: number
  /** Operador da sessão mais recente (ou da aberta); null se a máquina nunca foi usada. */
  ultimoOperador?: { nome: string } | null
}

export type MachineEventType = 'acidente' | 'manutencao'
export type AccidentCause = 'frenagem' | 'colisao' | 'tombamento'
export type UrgencyLevel = 'media' | 'alta' | 'critica'

export const ACCIDENT_URGENCY: Record<AccidentCause, UrgencyLevel> = {
  frenagem: 'media',
  colisao: 'alta',
  tombamento: 'critica',
}

export interface MachineEvent {
  id: string
  machineId: string
  tipo: MachineEventType
  operador: string
  data: string
  inicio: string
  fim: string
  causa?: AccidentCause
}

/** Dias do período padrão dos filtros de data. */
export const DEFAULT_PERIOD_DAYS = 30

/** Período padrão dos filtros: dos últimos 30 dias até hoje, em data local ('sv' formata como AAAA-MM-DD). */
export function defaultPeriod(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - DEFAULT_PERIOD_DAYS)
  return { from: from.toLocaleDateString('sv'), to: to.toLocaleDateString('sv') }
}

/** API incident as an `acidente` event; the sensor reports a collision, the collaborator report has no cause. */
export function incidentToEvent(incident: Incidente): MachineEvent {
  const date = new Date(incident.dataIncidente)
  const time = date.toLocaleTimeString('sv')
  return {
    id: incident._id,
    machineId: incident.machineId,
    tipo: 'acidente',
    operador: incident.operador?.nome ?? '',
    data: date.toLocaleDateString('sv'),
    inicio: time,
    fim: time,
    ...(incident.origem === 'sensor' && { causa: 'colisao' as const }),
  }
}

/** Card urgency: the cause decides; a collaborator report without cause is `alta`. */
export const eventUrgency = (event: MachineEvent): UrgencyLevel => (event.causa ? ACCIDENT_URGENCY[event.causa] : 'alta')

export interface MachineFilters {
  query?: string
  status?: MachineStatus | 'Todos'
  /** 'Todos' or missing = any sector. */
  setorId?: string
}

export function filterMachines(machines: Machine[], filters: MachineFilters): Machine[] {
  const query = filters.query?.trim().toLowerCase() ?? ''
  const status = filters.status ?? 'Todos'
  const setorId = filters.setorId ?? 'Todos'

  return machines.filter((machine) => {
    const matchesQuery =
      query.length === 0 ||
      machine.identificacao.toLowerCase().includes(query) ||
      machine.setor.toLowerCase().includes(query)

    const matchesStatus = status === 'Todos' || machine.status === status

    const matchesSector = setorId === 'Todos' || machine.setorId === setorId

    return matchesQuery && matchesStatus && matchesSector
  })
}

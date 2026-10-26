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
  tempoUsoTotalHoras?: number
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

export const DEFAULT_PERIOD = { from: '2024-07-14', to: '2026-07-14' }

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

/** Default end of the period: today when it is past DEFAULT_PERIOD.to, so new incidents show up. */
export const defaultPeriodTo = () => [DEFAULT_PERIOD.to, new Date().toLocaleDateString('sv')].sort()[1]

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

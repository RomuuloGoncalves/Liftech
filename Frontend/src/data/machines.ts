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
  dispositivoOffline?: boolean
  alertaTipos?: string[]
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
export type AccidentCause =
  | 'colisao'
  | 'frenagem_brusca'
  | 'aceleracao_brusca'
  | 'curva_brusca'
  | 'inclinacao_excessiva'
export type UrgencyLevel = 'media' | 'alta' | 'critica'

export const ACCIDENT_URGENCY: Record<AccidentCause, UrgencyLevel> = {
  colisao: 'alta',
  frenagem_brusca: 'media',
  aceleracao_brusca: 'media',
  curva_brusca: 'media',
  inclinacao_excessiva: 'critica',
}

const URGENCY_PRIORITY: Record<UrgencyLevel, number> = {
  critica: 3,
  alta: 2,
  media: 1,
}

/**
 * Retorna a maior urgência dos incidentes da máquina (baseada em `alertaTipos`).
 * `alertaTipos` vem ordenado do mais recente ao mais antigo.
 * Em caso de empate na maior urgência, prevalece a do tipo mais recente (primeiro de `alertaTipos`).
 * Se `alertaTipos` for vazio ou indefinido, devolve `undefined`.
 */
export function urgenciaDaMaquina(
  machine: Pick<Machine, 'alertaTipos'> | { alertaTipos?: (AccidentCause | string)[] | null }
): UrgencyLevel | undefined {
  const tipos = machine.alertaTipos
  if (!tipos || tipos.length === 0) return undefined

  let maiorUrgencia: UrgencyLevel | undefined = undefined
  let maiorPrioridade = 0

  for (const tipo of tipos) {
    const urgencia = ACCIDENT_URGENCY[tipo as AccidentCause]
    if (urgencia) {
      const prioridade = URGENCY_PRIORITY[urgencia]
      if (prioridade > maiorPrioridade) {
        maiorPrioridade = prioridade
        maiorUrgencia = urgencia
      }
    }
  }

  return maiorUrgencia
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

/** API incident as an `acidente` event; the sensor reports an accident cause (default colisao), the collaborator report has no cause. */
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
    ...(incident.origem === 'sensor' && { causa: ((incident.tipo ?? 'colisao') as AccidentCause) }),
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

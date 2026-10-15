import type { Machine } from './machines'
import type { MaquinaResumo, Sessao } from '../services/sessionService'

export interface UsageRecord {
  id: string
  machineId: string
  maquina: MaquinaResumo | null
  operatorName: string
  date: string
  start: string
  end: string
  durationLabel: string
}

// 'sv' formats as YYYY-MM-DD and HH:mm:ss in the local time zone.
const localDate = (date: Date) => date.toLocaleDateString('sv')
const localTime = (date: Date) => date.toLocaleTimeString('sv')

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const [h, m] = [Math.floor(total / 60), total % 60]
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`
}

export function toUsageRecord(session: Sessao, now = Date.now()): UsageRecord {
  const start = new Date(session.inicio)
  const end = session.fim ? new Date(session.fim) : null
  return {
    id: session._id,
    machineId: session.machineId,
    maquina: session.maquina,
    operatorName: session.operador.nome,
    date: localDate(start),
    start: localTime(start),
    end: end ? localTime(end) : '',
    durationLabel: formatDuration(((end?.getTime() ?? now) - start.getTime()) / 60000),
  }
}

export function filterAvailableMachines(machines: Machine[], query: string): Machine[] {
  const term = query.trim().toLowerCase()

  return machines.filter(
    (machine) =>
      machine.status === 'disponivel' &&
      (term.length === 0 ||
        machine.nome.toLowerCase().includes(term) ||
        machine.identificacao.toLowerCase().includes(term) ||
        machine.setor.toLowerCase().includes(term))
  )
}

export interface UsageFilters {
  from?: string
  to?: string
  startTime?: string
  endTime?: string
  machineQuery?: string
}

const toSeconds = (time: string) => (time.length === 5 ? `${time}:00` : time)

export function filterUsageHistory(records: UsageRecord[], filters: UsageFilters): UsageRecord[] {
  const { from, to, startTime, endTime } = filters
  const term = filters.machineQuery?.trim().toLowerCase() ?? ''

  if (from && to && from > to) return []

  return records.filter((record) => {
    if (from && record.date < from) return false
    if (to && record.date > to) return false
    if (startTime && record.start < toSeconds(startTime)) return false
    if (endTime && record.start > toSeconds(endTime)) return false
    if (term.length === 0) return true

    const machine = record.maquina
    return (
      !!machine &&
      (machine.nome.toLowerCase().includes(term) ||
        machine.identificacao.toLowerCase().includes(term) ||
        machine.setor.toLowerCase().includes(term))
    )
  })
}

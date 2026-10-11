import { MACHINES, type Machine } from './machines'

export interface UsageRecord {
  id: string
  machineId: string
  operatorName: string
  date: string
  start: string
  end: string
  durationLabel: string
}

export interface WorkShift {
  start: string
  end: string
  dailyHours: number
  remainingHours: number
}

export interface LastMachineUsage {
  machineId: string
  nome: string
  identificacao: string
  date: string
}

export const EMPLOYEE_NAME = 'Alexandre Gomes'

export const WORK_SHIFT: WorkShift = { start: '08:00', end: '17:00', dailyHours: 8, remainingHours: 4 }

export const LAST_MACHINE_USAGE: LastMachineUsage = {
  machineId: '4',
  nome: 'Empilhadeira elétrica Tital-X',
  identificacao: 'EMP-084',
  date: '2026-09-05',
}

const RECORD_SLOTS: Array<[string, string, string]> = [
  ['14:35:25', '16:35:20', '2h 00min'],
  ['08:10:00', '08:55:00', '45min'],
  ['09:00:00', '10:30:00', '1h 30min'],
  ['13:15:30', '16:15:30', '3h 00min'],
]

const RECORD_DATES = ['2025-09-14', '2025-09-12', '2025-09-10', '2025-09-08']

export const USAGE_HISTORY: UsageRecord[] = MACHINES.slice(0, 8).flatMap((machine, machineIndex) =>
  RECORD_SLOTS.map(([start, end, durationLabel], slot) => ({
    id: `usage-${machine.id}-${slot}`,
    machineId: machine.id,
    operatorName: EMPLOYEE_NAME,
    date: RECORD_DATES[(machineIndex + slot) % RECORD_DATES.length],
    start,
    end,
    durationLabel,
  }))
)

export function filterAvailableMachines(machines: Machine[], query: string): Machine[] {
  const term = query.trim().toLowerCase()

  return machines.filter(
    (machine) =>
      machine.dispositivoConectado.status === 'Disponível' &&
      (term.length === 0 ||
        machine.nome.toLowerCase().includes(term) ||
        machine.identificacao.toLowerCase().includes(term) ||
        machine.setor.toLowerCase().includes(term))
  )
}

export function findAvailableMachine(id: string): Machine | undefined {
  return MACHINES.find((machine) => machine.id === id && machine.dispositivoConectado.status === 'Disponível')
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

    const machine = MACHINES.find((item) => item.id === record.machineId)
    return (
      !!machine &&
      (machine.nome.toLowerCase().includes(term) ||
        machine.identificacao.toLowerCase().includes(term) ||
        machine.setor.toLowerCase().includes(term))
    )
  })
}

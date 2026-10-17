import { MACHINES } from '../../data/machines'
import type { FiltroSessoes, Sessao } from '../../services/sessionService'

/** Builds an API session from local date and times, as the backend would send it. */
export const sessao = (machineId: string, date: string, start: string, end: string | null, id = `${machineId}-${date}-${start}`): Sessao => {
  const machine = MACHINES.find((item) => item.id === machineId)
  return {
    _id: id,
    machineId,
    maquina: machine ? { nome: machine.nome, identificacao: machine.identificacao, setor: machine.setor } : null,
    operador: { nome: 'Alexandre Gomes' },
    inicio: new Date(`${date}T${start}`).toISOString(),
    fim: end ? new Date(`${date}T${end}`).toISOString() : null,
  }
}

const SLOTS: Array<[string, string]> = [
  ['14:35:25', '16:35:20'],
  ['08:10:00', '08:55:00'],
  ['09:00:00', '10:30:00'],
  ['13:15:30', '16:15:30'],
]
const DATES = ['2025-09-14', '2025-09-12', '2025-09-10', '2025-09-08']

/** 4 sessions on each of the first 8 machines, spread over 4 days. */
export const USAGE_SESSIONS: Sessao[] = MACHINES.slice(0, 8).flatMap((machine, machineIndex) =>
  SLOTS.map(([start, end], slot) => sessao(machine.id, DATES[(machineIndex + slot) % DATES.length], start, end))
)

/** Stand-in for GET /sessions: filters by machine and by local day, inclusive. */
export const listSessions = async ({ machineId, from, to }: FiltroSessoes = {}): Promise<Sessao[]> => {
  const day = (s: Sessao) => new Date(s.inicio).toLocaleDateString('sv')
  return USAGE_SESSIONS.filter(
    (s) => (!machineId || s.machineId === machineId) && (!from || day(s) >= from) && (!to || day(s) <= to)
  )
}

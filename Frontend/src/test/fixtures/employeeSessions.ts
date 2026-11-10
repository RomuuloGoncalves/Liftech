import { MACHINES } from './machines'
import type { FiltroSessoes, Sessao } from '../../services/sessionService'

/** Constrói uma sessão da API a partir de datas e horários locais, como o backend enviaria. */
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

/** 4 sessões em cada uma das primeiras 8 máquinas, distribuídas em 4 dias. */
const USAGE_SESSIONS: Sessao[] = MACHINES.slice(0, 8).flatMap((machine, machineIndex) =>
  SLOTS.map(([start, end], slot) => sessao(machine.id, DATES[(machineIndex + slot) % DATES.length], start, end))
)

/** Substituto para GET /sessions: filtra por máquina e por dia local, inclusivo. */
export const listSessions = async ({ machineId, from, to }: FiltroSessoes = {}): Promise<Sessao[]> => {
  const day = (s: Sessao) => new Date(s.inicio).toLocaleDateString('sv')
  return USAGE_SESSIONS.filter(
    (s) => (!machineId || s.machineId === machineId) && (!from || day(s) >= from) && (!to || day(s) <= to)
  )
}

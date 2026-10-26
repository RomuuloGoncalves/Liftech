import {
  filterAvailableMachines,
  filterUsageHistory,
  formatDuration,
  toUsageRecord,
  type UsageRecord,
} from '../../data/employeeArea'
import { MACHINES } from '../fixtures/machines'

const maquinaOf = (machineId: string) => {
  const machine = MACHINES.find((item) => item.id === machineId)!
  return { nome: machine.nome, identificacao: machine.identificacao, setor: machine.setor }
}

const record = (overrides: Partial<UsageRecord>): UsageRecord => ({
  id: 'r',
  machineId: '1',
  maquina: maquinaOf(overrides.machineId ?? '1'),
  operatorName: 'Alexandre Gomes',
  date: '2025-09-14',
  start: '08:00:00',
  end: '09:00:00',
  durationLabel: '1h 00min',
  ...overrides,
})

describe('toUsageRecord', () => {
  const sessao = {
    _id: 's1',
    machineId: '1',
    maquina: maquinaOf('1'),
    operador: { nome: 'Carlos Silva' },
    inicio: new Date('2025-09-14T14:35:25').toISOString(),
    fim: new Date('2025-09-14T16:35:20').toISOString(),
  }

  it('converts an API session to a record in local date and time', () => {
    expect(toUsageRecord(sessao)).toEqual({
      id: 's1',
      machineId: '1',
      maquina: maquinaOf('1'),
      operatorName: 'Carlos Silva',
      date: '2025-09-14',
      start: '14:35:25',
      end: '16:35:20',
      durationLabel: '2h 00min',
    })
  })

  it('counts an open session until now and keeps a deleted machine as null', () => {
    const now = new Date('2025-09-14T15:20:25').getTime()
    const result = toUsageRecord({ ...sessao, maquina: null, fim: null }, now)
    expect(result.end).toBe('')
    expect(result.durationLabel).toBe('45min')
    expect(result.maquina).toBeNull()
  })
})

describe('formatDuration', () => {
  it('formats minutes as hours and padded minutes', () => {
    expect(formatDuration(45)).toBe('45min')
    expect(formatDuration(90)).toBe('1h 30min')
    expect(formatDuration(119.9)).toBe('2h 00min')
    expect(formatDuration(-3)).toBe('0min')
  })
})

describe('filterAvailableMachines', () => {
  it('returns only machines with status Disponível', () => {
    const result = filterAvailableMachines(MACHINES, '')
    expect(result.length).toBeGreaterThan(0)
    result.forEach((machine) => expect(machine.status).toBe('disponivel'))
    expect(result).toHaveLength(MACHINES.filter((m) => m.status === 'disponivel').length)
  })

  it('searches name, identificacao and sector ignoring case', () => {
    expect(filterAvailableMachines(MACHINES, 'emp-083').map((m) => m.id)).toEqual(['3'])
    expect(filterAvailableMachines(MACHINES, 'ATLAS').every((m) => m.nome.includes('Atlas'))).toBe(true)
    expect(filterAvailableMachines(MACHINES, 'armazenagem').map((m) => m.setor)).toEqual(
      expect.arrayContaining(['Armazenagem - Bloco C'])
    )
  })

  it('does not offer a machine in alerta', () => {
    expect(filterAvailableMachines(MACHINES, 'EMP-081')).toEqual([])
  })

  it('does not return unavailable machines even when the query matches them', () => {
    expect(filterAvailableMachines(MACHINES, 'EMP-082')).toEqual([])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterAvailableMachines(MACHINES, 'zzz')).toEqual([])
  })
})

describe('filterUsageHistory', () => {
  const records = [
    record({ id: 'a', machineId: '1', date: '2025-09-14', start: '08:00:00' }),
    record({ id: 'b', machineId: '5', date: '2025-09-12', start: '10:30:00' }),
    record({ id: 'c', machineId: '1', date: '2025-09-10', start: '14:35:25' }),
  ]
  const ids = (list: UsageRecord[]) => list.map((item) => item.id)

  it('returns everything without filters', () => {
    expect(ids(filterUsageHistory(records, {}))).toEqual(['a', 'b', 'c'])
  })

  it('filters by period inclusively', () => {
    expect(ids(filterUsageHistory(records, { from: '2025-09-12', to: '2025-09-14' }))).toEqual(['a', 'b'])
    expect(ids(filterUsageHistory(records, { from: '2025-09-13' }))).toEqual(['a'])
    expect(ids(filterUsageHistory(records, { to: '2025-09-10' }))).toEqual(['c'])
  })

  it('returns an empty list when from is after to', () => {
    expect(filterUsageHistory(records, { from: '2025-09-14', to: '2025-09-10' })).toEqual([])
  })

  it('filters by the record start time with HH:MM bounds', () => {
    expect(ids(filterUsageHistory(records, { startTime: '10:00' }))).toEqual(['b', 'c'])
    expect(ids(filterUsageHistory(records, { endTime: '10:30' }))).toEqual(['a', 'b'])
    expect(ids(filterUsageHistory(records, { startTime: '08:00', endTime: '08:00' }))).toEqual(['a'])
  })

  it('never matches a record whose machine was deleted', () => {
    expect(filterUsageHistory([record({ maquina: null })], { machineQuery: 'emp' })).toEqual([])
  })

  it('filters by machine query ignoring case', () => {
    expect(ids(filterUsageHistory(records, { machineQuery: 'emp-081' }))).toEqual(['a', 'c'])
    expect(ids(filterUsageHistory(records, { machineQuery: 'ATLAS' }))).toEqual(['b'])
  })

  it('combines every active filter', () => {
    const filters = { from: '2025-09-10', to: '2025-09-14', startTime: '09:00', endTime: '15:00', machineQuery: 'emp-081' }
    expect(ids(filterUsageHistory(records, filters))).toEqual(['c'])
  })
})

import { describe, expect, it } from 'vitest'
import {
  LAST_MACHINE_USAGE,
  USAGE_HISTORY,
  WORK_SHIFT,
  filterAvailableMachines,
  filterUsageHistory,
  findAvailableMachine,
  type UsageRecord,
} from '../../data/employeeArea'
import { MACHINES } from '../../data/machines'

const record = (overrides: Partial<UsageRecord>): UsageRecord => ({
  id: 'r',
  machineId: '1',
  operatorName: 'Alexandre Gomes',
  date: '2025-09-14',
  start: '08:00:00',
  end: '09:00:00',
  durationLabel: '1h 00min',
  ...overrides,
})

describe('employee mock data', () => {
  it('matches the Figma shift and last machine', () => {
    expect(WORK_SHIFT).toEqual({ start: '08:00', end: '17:00', dailyHours: 8, remainingHours: 4 })
    expect(LAST_MACHINE_USAGE.identificacao).toBe('EMP-084')
    expect(LAST_MACHINE_USAGE.nome).toBe('Empilhadeira elétrica Tital-X')
    expect(LAST_MACHINE_USAGE.date).toBe('2026-09-05')
  })

  it('has usage records of Alexandre Gomes on 2025-09-14 pointing to real machines', () => {
    expect(USAGE_HISTORY.some((item) => item.date === '2025-09-14')).toBe(true)
    USAGE_HISTORY.forEach((item) => {
      expect(item.operatorName).toBe('Alexandre Gomes')
      expect(item.start).toMatch(/^\d{2}:\d{2}:\d{2}$/)
      expect(item.end).toMatch(/^\d{2}:\d{2}:\d{2}$/)
      expect(MACHINES.some((machine) => machine.id === item.machineId)).toBe(true)
    })
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
    expect(findAvailableMachine('1')).toBeUndefined()
  })

  it('does not return unavailable machines even when the query matches them', () => {
    expect(filterAvailableMachines(MACHINES, 'EMP-082')).toEqual([])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterAvailableMachines(MACHINES, 'zzz')).toEqual([])
  })
})

describe('findAvailableMachine', () => {
  it('finds an available machine by id', () => {
    expect(findAvailableMachine('3')?.identificacao).toBe('EMP-083')
  })

  it('returns undefined for unknown ids and for unavailable machines', () => {
    expect(findAvailableMachine('999')).toBeUndefined()
    expect(findAvailableMachine('2')).toBeUndefined()
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

  it('filters by machine query ignoring case', () => {
    expect(ids(filterUsageHistory(records, { machineQuery: 'emp-081' }))).toEqual(['a', 'c'])
    expect(ids(filterUsageHistory(records, { machineQuery: 'ATLAS' }))).toEqual(['b'])
  })

  it('combines every active filter', () => {
    const filters = { from: '2025-09-10', to: '2025-09-14', startTime: '09:00', endTime: '15:00', machineQuery: 'emp-081' }
    expect(ids(filterUsageHistory(records, filters))).toEqual(['c'])
  })
})

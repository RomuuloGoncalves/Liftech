import { describe, expect, it } from 'vitest'
import { MACHINES, filterMachines } from '../../data/machines'

describe('MACHINES mock dataset', () => {
  it('has 16 machines, each with identificacao, setor and device data', () => {
    expect(MACHINES).toHaveLength(16)
    MACHINES.forEach((machine) => {
      expect(machine.identificacao).toBeTruthy()
      expect(machine.setor).toBeTruthy()
      expect(machine.dispositivoConectado.enderecoMac).toBeTruthy()
      expect(machine.dispositivoConectado.status).toBeTruthy()
    })
  })
})

describe('filterMachines', () => {
  it('returns all machines when no filters are given', () => {
    expect(filterMachines(MACHINES, {})).toHaveLength(MACHINES.length)
  })

  it('filters by identificacao, case-insensitive', () => {
    const result = filterMachines(MACHINES, { query: 'emp-084' })
    expect(result).toHaveLength(1)
    expect(result[0].identificacao).toBe('EMP-084')
  })

  it('filters by setor, case-insensitive', () => {
    const result = filterMachines(MACHINES, { query: 'recebimento' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach((machine) => expect(machine.setor.toLowerCase()).toContain('recebimento'))
  })

  it('returns all machines again when the query is cleared', () => {
    const filtered = filterMachines(MACHINES, { query: 'emp-084' })
    expect(filtered).toHaveLength(1)
    const cleared = filterMachines(MACHINES, { query: '' })
    expect(cleared).toHaveLength(MACHINES.length)
  })

  it('filters by status', () => {
    const result = filterMachines(MACHINES, { status: 'Manutenção' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach((machine) => expect(machine.dispositivoConectado.status).toBe('Manutenção'))
  })

  it('combines query and status filters', () => {
    const result = filterMachines(MACHINES, { query: 'bloco b', status: 'Disponível' })
    result.forEach((machine) => {
      expect(machine.setor.toLowerCase()).toContain('bloco b')
      expect(machine.dispositivoConectado.status).toBe('Disponível')
    })
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterMachines(MACHINES, { query: 'inexistente-xyz' })).toHaveLength(0)
  })
})

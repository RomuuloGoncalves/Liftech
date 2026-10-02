import { describe, expect, it } from 'vitest'
import {
  ACCIDENT_URGENCY,
  DEFAULT_PERIOD,
  MACHINE_EVENTS,
  MACHINES,
  eventsForMachine,
  filterEvents,
  filterMachines,
  type MachineEvent,
} from '../../data/machines'

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

describe('machine detail mocks', () => {
  it('gives every machine a device name and total usage hours', () => {
    MACHINES.forEach((machine) => {
      expect(machine.dispositivoConectado.nomeDispositivo).toBeTruthy()
      expect(machine.tempoUsoTotalHoras).toBeGreaterThan(0)
    })
  })

  it('has accident and maintenance events for every machine, all inside the default period', () => {
    MACHINES.forEach((machine) => {
      const events = eventsForMachine(machine.id)
      expect(events.some((e) => e.tipo === 'acidente')).toBe(true)
      expect(events.some((e) => e.tipo === 'manutencao')).toBe(true)
      events.forEach((e) => {
        expect(e.data >= DEFAULT_PERIOD.from && e.data <= DEFAULT_PERIOD.to).toBe(true)
      })
    })
  })
})

describe('filterEvents', () => {
  const ev = (id: string, tipo: MachineEvent['tipo'], data: string, inicio = '08:00:00'): MachineEvent => ({
    id,
    machineId: '1',
    tipo,
    operador: 'X',
    data,
    inicio,
    fim: '09:00:00',
  })
  const events = [
    ev('a', 'acidente', '2025-01-10'),
    ev('b', 'acidente', '2025-03-05'),
    ev('c', 'manutencao', '2025-02-01'),
    ev('d', 'acidente', '2025-03-05', '15:00:00'),
  ]

  it('keeps only the requested type', () => {
    const result = filterEvents(events, { tipo: 'manutencao', from: '', to: '' })
    expect(result.map((e) => e.id)).toEqual(['c'])
  })

  it('orders newest first, breaking ties by start time', () => {
    const result = filterEvents(events, { tipo: 'acidente', from: '', to: '' })
    expect(result.map((e) => e.id)).toEqual(['d', 'b', 'a'])
  })

  it('includes events on the start and end dates', () => {
    const result = filterEvents(events, { tipo: 'acidente', from: '2025-01-10', to: '2025-03-05' })
    expect(result.map((e) => e.id)).toEqual(['d', 'b', 'a'])
  })

  it('excludes events outside the period', () => {
    expect(filterEvents(events, { tipo: 'acidente', from: '2025-01-11', to: '2025-03-04' })).toEqual([])
    expect(filterEvents(events, { tipo: 'acidente', from: '2025-03-01', to: '' }).map((e) => e.id)).toEqual(['d', 'b'])
  })

  it('returns an empty list when the start date is after the end date', () => {
    expect(filterEvents(events, { tipo: 'acidente', from: '2025-03-05', to: '2025-01-10' })).toEqual([])
  })

  it('does not mutate the input list', () => {
    const copy = [...events]
    filterEvents(events, { tipo: 'acidente', from: '', to: '' })
    expect(events).toEqual(copy)
  })
})

describe('accident cause and urgency', () => {
  it('maps frenagem to media, colisao to alta and tombamento to critica', () => {
    expect(ACCIDENT_URGENCY).toEqual({ frenagem: 'media', colisao: 'alta', tombamento: 'critica' })
  })

  it('gives every accident a cause, and no maintenance event a cause', () => {
    MACHINE_EVENTS.forEach((event) => {
      if (event.tipo === 'acidente') expect(Object.keys(ACCIDENT_URGENCY)).toContain(event.causa)
      else expect(event.causa).toBeUndefined()
    })
  })

  it('uses all three causes in the mock', () => {
    const causes = new Set(MACHINE_EVENTS.map((event) => event.causa).filter(Boolean))
    expect([...causes].sort()).toEqual(['colisao', 'frenagem', 'tombamento'])
  })
})

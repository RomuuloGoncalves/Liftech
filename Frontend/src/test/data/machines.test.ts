import { describe, expect, it } from 'vitest'
import {
  ACCIDENT_URGENCY,
  MACHINE_STATUSES,
  eventUrgency,
  filterMachines,
  incidentToEvent,
} from '../../data/machines'
import { MACHINES } from '../fixtures/machines'
import type { Incidente } from '../../services/incidentService'

describe('incidentToEvent', () => {
  const incident: Incidente = {
    _id: 'i1',
    machineId: 'm1',
    maquina: { nome: 'Titan-X', identificacao: 'EMP-081', setor: 'Expedição' },
    operador: { nome: 'Carlos Silva' },
    dataIncidente: new Date('2026-10-15T09:30:05').toISOString(),
    forcaImpacto: 3.2,
    status: 'pendente',
    origem: 'sensor',
    descricao: null,
  }

  it('turns a sensor incident into an accident caused by a collision, in local date and time', () => {
    const event = incidentToEvent(incident)
    expect(event).toEqual({
      id: 'i1',
      machineId: 'm1',
      tipo: 'acidente',
      operador: 'Carlos Silva',
      data: '2026-10-15',
      inicio: '09:30:05',
      fim: '09:30:05',
      causa: 'colisao',
    })
    expect(eventUrgency(event)).toBe('alta')
  })

  it('leaves a collaborator report without cause, with urgency alta, and no operator as empty', () => {
    const event = incidentToEvent({ ...incident, origem: 'funcionario', operador: null })
    expect(event.causa).toBeUndefined()
    expect(event.operador).toBe('')
    expect(eventUrgency(event)).toBe('alta')
  })

  it('keeps the cause urgency for mock events', () => {
    expect(eventUrgency({ ...incidentToEvent(incident), causa: 'tombamento' })).toBe('critica')
  })
})

describe('MACHINES mock dataset', () => {
  it('has 16 machines, each with identificacao, setor and device data', () => {
    expect(MACHINES).toHaveLength(16)
    MACHINES.forEach((machine) => {
      expect(machine.identificacao).toBeTruthy()
      expect(machine.setor).toBeTruthy()
      expect(machine.dispositivoConectado.enderecoMac).toBeTruthy()
      expect(MACHINE_STATUSES).toContain(machine.status)
      expect(machine).not.toHaveProperty('dispositivoConectado.status')
    })
  })

  it('puts EMP-081, EMP-085 and EMP-089 in alerta, like the backend seed', () => {
    expect(MACHINES.filter((m) => m.status === 'alerta').map((m) => m.identificacao)).toEqual(['EMP-081', 'EMP-085', 'EMP-089'])
  })

  it('lists the 5 status codes', () => {
    expect(MACHINE_STATUSES).toEqual(['disponivel', 'em_uso', 'manutencao', 'alerta', 'offline'])
  })
})

describe('filterMachines', () => {
  const linked = MACHINES.map((machine) => ({ ...machine, setorId: ['1', '2', '3'].includes(machine.id) ? 's1' : null }))

  it('keeps only the machines of the chosen sector', () => {
    expect(filterMachines(linked, { setorId: 's1' }).map((m) => m.id)).toEqual(['1', '2', '3'])
  })

  it('does not filter by sector with "Todos" or without setorId', () => {
    expect(filterMachines(linked, { setorId: 'Todos' })).toHaveLength(MACHINES.length)
    expect(filterMachines(linked, {})).toHaveLength(MACHINES.length)
  })

  it('combines the sector with the query and the status', () => {
    expect(filterMachines(linked, { setorId: 's1', status: 'alerta' }).map((m) => m.id)).toEqual(['1'])
    expect(filterMachines(linked, { setorId: 's1', query: 'emp-083' }).map((m) => m.id)).toEqual(['3'])
    expect(filterMachines(linked, { setorId: 's1', query: 'emp-085' })).toEqual([])
  })

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

  it('filters by alerta', () => {
    expect(filterMachines(MACHINES, { status: 'alerta' }).map((m) => m.id)).toEqual(['1', '5', '9'])
  })

  it('filters by status', () => {
    const result = filterMachines(MACHINES, { status: 'manutencao' })
    expect(result.length).toBeGreaterThan(0)
    result.forEach((machine) => expect(machine.status).toBe('manutencao'))
  })

  it('combines query and status filters', () => {
    const result = filterMachines(MACHINES, { query: 'bloco b', status: 'disponivel' })
    result.forEach((machine) => {
      expect(machine.setor.toLowerCase()).toContain('bloco b')
      expect(machine.status).toBe('disponivel')
    })
  })

  it('returns an empty array when nothing matches', () => {
    expect(filterMachines(MACHINES, { query: 'inexistente-xyz' })).toHaveLength(0)
  })
})

describe('accident cause and urgency', () => {
  it('maps frenagem to media, colisao to alta and tombamento to critica', () => {
    expect(ACCIDENT_URGENCY).toEqual({ frenagem: 'media', colisao: 'alta', tombamento: 'critica' })
  })
})

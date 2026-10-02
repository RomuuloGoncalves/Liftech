import { describe, expect, it } from 'vitest'
import { MACHINES, type Machine, type MachineEvent } from '../../data/machines'
import {
  addMachines,
  categoryNameError,
  createCategory,
  deleteCategory,
  initialBoard,
  isHexColor,
  lastAccidentDate,
  matchesMachine,
  moveMachine,
  removeMachine,
  unassignedMachines,
  type FleetCategory,
} from '../../data/fleet'

const idsOf = (board: FleetCategory[], id: string) => board.find((c) => c.id === id)!.machineIds
const byCode = (code: string) => MACHINES.find((m) => m.identificacao === code)!.id
const allIds = (board: FleetCategory[]) => board.flatMap((c) => c.machineIds)

describe('initialBoard', () => {
  const board = initialBoard(MACHINES)

  it('creates Acidentes, Ativas, Manutenção, Disponíveis in this order', () => {
    expect(board.map((c) => c.kind)).toEqual(['acidentes', 'ativas', 'manutencao', 'disponiveis'])
  })

  it('places EMP-081, EMP-085 and EMP-089 in Acidentes', () => {
    expect(idsOf(board, 'acidentes')).toEqual([byCode('EMP-081'), byCode('EMP-085'), byCode('EMP-089')])
  })

  it('places the other machines by status and leaves Offline machines out', () => {
    const accidents = new Set(idsOf(board, 'acidentes'))
    const expected = (status: Machine['dispositivoConectado']['status']) =>
      MACHINES.filter((m) => m.dispositivoConectado.status === status && !accidents.has(m.id)).map((m) => m.id)

    expect(idsOf(board, 'ativas')).toEqual(expected('Em uso'))
    expect(idsOf(board, 'manutencao')).toEqual(expected('Manutenção'))
    expect(idsOf(board, 'disponiveis')).toEqual(expected('Disponível'))
    const offline = MACHINES.filter((m) => m.dispositivoConectado.status === 'Offline').map((m) => m.id)
    expect(offline.length).toBeGreaterThan(0)
    offline.forEach((id) => expect(allIds(board)).not.toContain(id))
  })

  it('keeps every machine in at most one category', () => {
    const ids = allIds(board)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('moveMachine', () => {
  const board = initialBoard(MACHINES)
  const machineId = idsOf(board, 'ativas')[0]

  it('moves the machine to the end of the target row and out of the source', () => {
    const next = moveMachine(board, machineId, 'manutencao')
    expect(idsOf(next, 'manutencao').at(-1)).toBe(machineId)
    expect(idsOf(next, 'ativas')).not.toContain(machineId)
    expect(idsOf(next, 'manutencao')).toHaveLength(idsOf(board, 'manutencao').length + 1)
    expect(idsOf(next, 'ativas')).toHaveLength(idsOf(board, 'ativas').length - 1)
  })

  it('keeps the order unchanged when dropped on its own row', () => {
    const next = moveMachine(board, machineId, 'ativas')
    expect(next).toBe(board)
  })

  it('places a machine without category into the target row', () => {
    const offlineId = MACHINES.find((m) => m.dispositivoConectado.status === 'Offline')!.id
    const next = moveMachine(board, offlineId, 'ativas')
    expect(idsOf(next, 'ativas').at(-1)).toBe(offlineId)
  })

  it('does not change the machine status', () => {
    const before = structuredClone(MACHINES)
    moveMachine(board, machineId, 'manutencao')
    expect(MACHINES).toEqual(before)
  })
})

describe('removeMachine', () => {
  it('removes the machine from its row so it becomes unassigned', () => {
    const board = initialBoard(MACHINES)
    const machineId = idsOf(board, 'disponiveis')[0]
    const next = removeMachine(board, machineId)
    expect(allIds(next)).not.toContain(machineId)
    expect(unassignedMachines(next, MACHINES).map((m) => m.id)).toContain(machineId)
  })
})

describe('addMachines', () => {
  const board = initialBoard(MACHINES)
  const unassigned = unassignedMachines(board, MACHINES).map((m) => m.id)

  it('appends the given machines to the end of the row', () => {
    const next = addMachines(board, 'ativas', unassigned)
    expect(idsOf(next, 'ativas').slice(-unassigned.length)).toEqual(unassigned)
  })

  it('ignores machines that already have a category', () => {
    const assigned = idsOf(board, 'disponiveis')[0]
    const next = addMachines(board, 'ativas', [assigned])
    expect(idsOf(next, 'ativas')).toEqual(idsOf(board, 'ativas'))
    expect(idsOf(next, 'disponiveis')).toContain(assigned)
  })
})

describe('unassignedMachines', () => {
  it('lists only machines without category', () => {
    const board = initialBoard(MACHINES)
    const assigned = new Set(allIds(board))
    const result = unassignedMachines(board, MACHINES)
    expect(result.length).toBe(MACHINES.length - assigned.size)
    result.forEach((m) => expect(assigned.has(m.id)).toBe(false))
  })
})

describe('createCategory / deleteCategory', () => {
  it('appends an empty custom category with the given name and color', () => {
    const board = initialBoard(MACHINES)
    const next = createCategory(board, 'Reserva', '#3AFF3A')
    const created = next.at(-1)!
    expect(next).toHaveLength(board.length + 1)
    expect(created).toMatchObject({ kind: 'custom', nome: 'Reserva', cor: '#3AFF3A', machineIds: [] })
  })

  it('gives each created category a unique id', () => {
    const board = createCategory(createCategory(initialBoard(MACHINES), 'A', '#3A9CFF'), 'B', '#3A9CFF')
    const ids = board.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('deletes a custom category and leaves its machines without category', () => {
    let board = createCategory(initialBoard(MACHINES), 'Reserva', '#3AFF3A')
    const custom = board.at(-1)!
    const offlineId = unassignedMachines(board, MACHINES)[0].id
    board = addMachines(board, custom.id, [offlineId])
    const next = deleteCategory(board, custom.id)
    expect(next.find((c) => c.id === custom.id)).toBeUndefined()
    expect(unassignedMachines(next, MACHINES).map((m) => m.id)).toContain(offlineId)
  })

  it('does not delete the initial categories', () => {
    const board = initialBoard(MACHINES)
    expect(deleteCategory(board, 'ativas')).toBe(board)
  })
})

describe('categoryNameError', () => {
  const existing = ['Acidentes', 'Reserva']

  it('returns required for empty or blank names', () => {
    expect(categoryNameError('', existing)).toBe('required')
    expect(categoryNameError('   ', existing)).toBe('required')
  })

  it('returns duplicate ignoring case and surrounding spaces', () => {
    expect(categoryNameError('  reserva ', existing)).toBe('duplicate')
    expect(categoryNameError('ACIDENTES', existing)).toBe('duplicate')
  })

  it('returns null for a new name', () => {
    expect(categoryNameError('Pátio', existing)).toBeNull()
  })
})

describe('isHexColor', () => {
  it('accepts #RRGGBB in any case', () => {
    expect(isHexColor('#3AFF3A')).toBe(true)
    expect(isHexColor('#3aff3a')).toBe(true)
  })

  it('rejects anything else', () => {
    ;['3AFF3A', '#3AF', '#3AFF3AA', '#GGGGGG', ''].forEach((value) => expect(isHexColor(value)).toBe(false))
  })
})

describe('matchesMachine', () => {
  const machine = MACHINES.find((m) => m.identificacao === 'EMP-085')!

  it('matches by code or name ignoring case', () => {
    expect(matchesMachine(machine, '085')).toBe(true)
    expect(matchesMachine(machine, 'atlas')).toBe(true)
    expect(matchesMachine(machine, '  ')).toBe(true)
  })

  it('does not match unrelated text', () => {
    expect(matchesMachine(machine, 'titan')).toBe(false)
  })
})

describe('lastAccidentDate', () => {
  const events: MachineEvent[] = [
    { id: 'a', machineId: '1', tipo: 'acidente', operador: 'X', data: '2025-01-10', inicio: '08:00:00', fim: '09:00:00' },
    { id: 'b', machineId: '1', tipo: 'acidente', operador: 'X', data: '2025-03-02', inicio: '08:00:00', fim: '09:00:00' },
    { id: 'c', machineId: '1', tipo: 'manutencao', operador: 'X', data: '2025-06-01', inicio: '08:00:00', fim: '09:00:00' },
  ]

  it('returns the most recent accident date and time of the machine', () => {
    expect(lastAccidentDate('1', events)).toEqual({ data: '2025-03-02', hora: '08:00:00' })
  })

  it('returns undefined when the machine has no accident', () => {
    expect(lastAccidentDate('2', events)).toBeUndefined()
  })
})

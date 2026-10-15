import { describe, expect, it } from 'vitest'
import { MACHINES as MOCK, type Machine, type MachineEvent } from '../../data/machines'
import type { Categoria } from '../../services/categoryService'
import {
  addMachines,
  categoryNameError,
  deleteCategory,
  isHexColor,
  lastAccidentDate,
  matchesMachine,
  montarQuadro,
  moveMachine,
  removeMachine,
  unassignedMachines,
  type FleetCategory,
} from '../../data/fleet'

const categoria = (chave: string, statusVinculados: Machine['status'][]): Categoria => ({
  _id: chave,
  nome: chave,
  cor: '#3A9CFF',
  chave,
  statusVinculados,
})
const CATEGORIAS = [
  categoria('acidentes', ['alerta']),
  categoria('ativas', ['em_uso']),
  categoria('manutencao', ['manutencao']),
  categoria('disponiveis', ['disponivel']),
]
// Cada máquina na categoria ligada ao status dela; offline fica sem categoria.
const MACHINES: Machine[] = MOCK.map((m) => ({
  ...m,
  categoriaId: CATEGORIAS.find((c) => c.statusVinculados.includes(m.status))?._id ?? null,
}))
const initialBoard = (machines: Machine[]) => montarQuadro(CATEGORIAS, machines)

const idsOf = (board: FleetCategory[], id: string) => board.find((c) => c.id === id)!.machineIds
const allIds = (board: FleetCategory[]) => board.flatMap((c) => c.machineIds)

describe('montarQuadro (FRT-04)', () => {
  it('builds one row per category in the API order', () => {
    const reversed = [...CATEGORIAS].reverse()
    expect(montarQuadro(reversed, MACHINES).map((c) => c.id)).toEqual(reversed.map((c) => c._id))
  })

  it('carries name, color, key and linked status of each category', () => {
    const [row] = montarQuadro([{ ...CATEGORIAS[1], nome: 'Pátio', cor: '#FF7A3A', chave: null }], [])
    expect(row).toEqual({ id: 'ativas', nome: 'Pátio', cor: '#FF7A3A', chave: null, statusVinculados: ['em_uso'], machineIds: [] })
  })

  it('places each machine in the row of its categoriaId', () => {
    const board = initialBoard(MACHINES)
    for (const c of CATEGORIAS) {
      expect(idsOf(board, c._id)).toEqual(MACHINES.filter((m) => m.categoriaId === c._id).map((m) => m.id))
    }
  })

  it('treats a machine whose category was deleted as unassigned', () => {
    const orphan = { ...MACHINES[0], categoriaId: 'apagada' }
    const board = initialBoard([orphan])
    expect(allIds(board)).toEqual([])
    expect(unassignedMachines(board, [orphan])).toEqual([orphan])
  })

  it('counts only the machines it received', () => {
    const some = MACHINES.filter((m) => m.categoriaId === 'ativas').slice(0, 1)
    const board = initialBoard(some)
    expect(board.map((c) => c.machineIds.length)).toEqual([0, 1, 0, 0])
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
    const offlineId = MACHINES.find((m) => m.status === 'offline')!.id
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

describe('deleteCategory', () => {
  it('drops the row and leaves its machines without category', () => {
    const board = initialBoard(MACHINES)
    const machineId = idsOf(board, 'ativas')[0]
    const next = deleteCategory(board, 'ativas')
    expect(next.map((c) => c.id)).toEqual(['acidentes', 'manutencao', 'disponiveis'])
    expect(unassignedMachines(next, MACHINES).map((m) => m.id)).toContain(machineId)
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

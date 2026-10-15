import type { Machine, MachineEvent, MachineStatus } from './machines'
import type { Categoria } from '../services/categoryService'

/** Chaves das categorias do quadro inicial: o nome vem de `fleet.category*` até alguém renomear. */
export type CategoryKey = 'acidentes' | 'ativas' | 'manutencao' | 'disponiveis'

export interface FleetCategory {
  id: string
  nome: string
  cor: string
  chave: CategoryKey | null
  statusVinculados: MachineStatus[]
  machineIds: string[]
}

export const CATEGORY_COLORS = ['#3A9CFF', '#3AFF3A', '#FFC93A', '#FF7A3A', '#9B3AFF', '#FF3AC4', '#3AE7FF']

/** Uma linha por categoria, na ordem da API; máquina com `categoriaId` sem categoria fica de fora (sem categoria). */
export function montarQuadro(categorias: Categoria[], maquinas: Machine[]): FleetCategory[] {
  return categorias.map((c) => ({
    id: c._id,
    nome: c.nome,
    cor: c.cor,
    chave: c.chave as CategoryKey | null,
    statusVinculados: c.statusVinculados,
    machineIds: maquinas.filter((m) => m.categoriaId === c._id).map((m) => m.id),
  }))
}

export function removeMachine(board: FleetCategory[], machineId: string): FleetCategory[] {
  return board.map((c) =>
    c.machineIds.includes(machineId) ? { ...c, machineIds: c.machineIds.filter((id) => id !== machineId) } : c
  )
}

export function moveMachine(board: FleetCategory[], machineId: string, toCategoryId: string): FleetCategory[] {
  const target = board.find((c) => c.id === toCategoryId)
  if (!target || target.machineIds.includes(machineId)) return board

  return removeMachine(board, machineId).map((c) =>
    c.id === toCategoryId ? { ...c, machineIds: [...c.machineIds, machineId] } : c
  )
}

export function addMachines(board: FleetCategory[], categoryId: string, machineIds: string[]): FleetCategory[] {
  const assigned = new Set(board.flatMap((c) => c.machineIds))
  const fresh = machineIds.filter((id) => !assigned.has(id))
  if (fresh.length === 0) return board

  return board.map((c) => (c.id === categoryId ? { ...c, machineIds: [...c.machineIds, ...fresh] } : c))
}

export function unassignedMachines(board: FleetCategory[], machines: Machine[]): Machine[] {
  const assigned = new Set(board.flatMap((c) => c.machineIds))
  return machines.filter((m) => !assigned.has(m.id))
}

export function deleteCategory(board: FleetCategory[], categoryId: string): FleetCategory[] {
  return board.filter((c) => c.id !== categoryId)
}

export function categoryNameError(nome: string, existingNames: string[]): 'required' | 'duplicate' | null {
  const normalized = nome.trim().toLowerCase()
  if (normalized === '') return 'required'
  if (existingNames.some((name) => name.trim().toLowerCase() === normalized)) return 'duplicate'
  return null
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value)
}

export function matchesMachine(machine: Machine, query: string): boolean {
  const q = query.trim().toLowerCase()
  return q === '' || machine.identificacao.toLowerCase().includes(q) || machine.nome.toLowerCase().includes(q)
}

export function lastAccidentDate(machineId: string, events: MachineEvent[]): { data: string; hora: string } | undefined {
  const latest = events
    .filter((e) => e.machineId === machineId && e.tipo === 'acidente')
    .sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio))[0]
  return latest && { data: latest.data, hora: latest.inicio }
}

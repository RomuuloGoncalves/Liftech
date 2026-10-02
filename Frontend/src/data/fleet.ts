import type { Machine, MachineEvent, MachineStatus } from './machines'

export type CategoryKind = 'acidentes' | 'ativas' | 'manutencao' | 'disponiveis' | 'custom'

export interface FleetCategory {
  id: string
  kind: CategoryKind
  /** Vazio nas categorias iniciais: o nome vem de `fleet.category.<kind>` no i18n. */
  nome: string
  cor: string
  machineIds: string[]
}

export const CATEGORY_COLORS = ['#3A9CFF', '#3AFF3A', '#FFC93A', '#FF7A3A', '#9B3AFF', '#FF3AC4', '#3AE7FF']

/** Máquinas que o mock coloca em Acidentes, como no frame do Figma. */
export const ACCIDENT_MACHINE_CODES = ['EMP-081', 'EMP-085', 'EMP-089']

const INITIAL: { kind: Exclude<CategoryKind, 'custom'>; cor: string; status?: MachineStatus }[] = [
  { kind: 'acidentes', cor: '#EF4444' },
  { kind: 'ativas', cor: '#3A9CFF', status: 'Em uso' },
  { kind: 'manutencao', cor: '#FFC93A', status: 'Manutenção' },
  { kind: 'disponiveis', cor: '#22C55E', status: 'Disponível' },
]

export function initialBoard(machines: Machine[]): FleetCategory[] {
  const accidents = machines.filter((m) => ACCIDENT_MACHINE_CODES.includes(m.identificacao))
  const rest = machines.filter((m) => !accidents.includes(m))

  return INITIAL.map(({ kind, cor, status }) => ({
    id: kind,
    kind,
    nome: '',
    cor,
    machineIds: (status ? rest.filter((m) => m.dispositivoConectado.status === status) : accidents).map((m) => m.id),
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

export function createCategory(board: FleetCategory[], nome: string, cor: string): FleetCategory[] {
  const next = Math.max(0, ...board.map((c) => Number(c.id.replace('custom-', '')) || 0)) + 1
  return [...board, { id: `custom-${next}`, kind: 'custom', nome: nome.trim(), cor, machineIds: [] }]
}

export function deleteCategory(board: FleetCategory[], categoryId: string): FleetCategory[] {
  const category = board.find((c) => c.id === categoryId)
  if (category?.kind !== 'custom') return board
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

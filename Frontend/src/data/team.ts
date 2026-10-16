import type { Setor } from '../services/sectorService'

export type Access = 'Permitido' | 'Negado'

export const ACCESS_VALUES: Access[] = ['Permitido', 'Negado']

export interface Employee {
  id: string
  matricula: string
  nome: string
  telefone: string
  cargo: string
  horarioEntrada: string
  horarioSaida: string
  filialId: string
  // null while the employee has no login; the API never sends the password.
  usuario: string | null
  acesso: Access
}

export type Sector = Setor

export interface EmployeeFilters {
  query?: string
  access?: Access | 'Todos'
}

export function filterEmployees(employees: Employee[], filters: EmployeeFilters): Employee[] {
  const query = filters.query?.trim().toLowerCase() ?? ''
  const access = filters.access ?? 'Todos'

  return employees.filter((employee) => {
    const matchesQuery =
      query.length === 0 ||
      employee.nome.toLowerCase().includes(query) ||
      employee.matricula.toLowerCase().includes(query) ||
      employee.cargo.toLowerCase().includes(query)

    return matchesQuery && (access === 'Todos' || employee.acesso === access)
  })
}

export interface SectorFilters {
  query?: string
}

export function filterSectors(sectors: Sector[], filters: SectorFilters): Sector[] {
  const query = filters.query?.trim().toLowerCase() ?? ''

  return sectors.filter(
    (sector) =>
      query.length === 0 ||
      sector.nome.toLowerCase().includes(query) ||
      sector.filial.nome.toLowerCase().includes(query)
  )
}

export function isUsernameTaken(employees: Employee[], usuario: string, ignoreId?: string): boolean {
  const wanted = usuario.trim().toLowerCase()
  return employees.some((employee) => employee.id !== ignoreId && employee.usuario?.toLowerCase() === wanted)
}

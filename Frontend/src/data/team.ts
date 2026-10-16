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

export interface Sector {
  id: string
  nome: string
  unidade: string
}

export const SECTORS: Sector[] = [
  { id: '1', nome: 'Expedição - Bloco B', unidade: 'Unidade Votorantin' },
  { id: '2', nome: 'Recebimento - Bloco A', unidade: 'Unidade Votorantin' },
  { id: '3', nome: 'Armazenagem - Bloco C', unidade: 'Unidade Votorantin' },
  { id: '4', nome: 'Expedição B - Acesso 3', unidade: 'Unidade Votorantin' },
  { id: '5', nome: 'Doca de Carga', unidade: 'Unidade Centro' },
  { id: '6', nome: 'Câmara Fria', unidade: 'Unidade Centro' },
  { id: '7', nome: 'Separação', unidade: 'Unidade Norte' },
  { id: '8', nome: 'Manutenção', unidade: 'Unidade Norte' },
]

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
      sector.unidade.toLowerCase().includes(query)
  )
}

export function isUsernameTaken(employees: Employee[], usuario: string, ignoreId?: string): boolean {
  const wanted = usuario.trim().toLowerCase()
  return employees.some((employee) => employee.id !== ignoreId && employee.usuario?.toLowerCase() === wanted)
}

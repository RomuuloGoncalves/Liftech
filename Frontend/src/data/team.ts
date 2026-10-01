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
  usuario: string
  senha: string
  acesso: Access
}

export interface Sector {
  id: string
  nome: string
  unidade: string
}

export const EMPLOYEES: Employee[] = [
  { id: '1', matricula: 'EMP-084', nome: 'Alexandre Mattos', telefone: '(55) 15 999999999', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00', usuario: 'AlexandreMattos', senha: 'Alexandre123', acesso: 'Permitido' },
  { id: '2', matricula: 'EMP-085', nome: 'Carlos Silva', telefone: '(55) 15 988887777', cargo: 'Operador', horarioEntrada: '07:00', horarioSaida: '16:00', usuario: 'CarlosSilva', senha: 'Carlos123', acesso: 'Permitido' },
  { id: '3', matricula: 'EMP-086', nome: 'Ana Souza', telefone: '(55) 15 977776666', cargo: 'Supervisora', horarioEntrada: '08:00', horarioSaida: '17:00', usuario: 'AnaSouza', senha: 'Ana12345', acesso: 'Permitido' },
  { id: '4', matricula: 'EMP-087', nome: 'João Pereira', telefone: '(55) 15 966665555', cargo: 'Operador', horarioEntrada: '14:00', horarioSaida: '22:00', usuario: 'JoaoPereira', senha: 'Joao12345', acesso: 'Permitido' },
  { id: '5', matricula: 'EMP-088', nome: 'Marina Costa', telefone: '(55) 15 955554444', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00', usuario: 'MarinaCosta', senha: 'Marina123', acesso: 'Permitido' },
  { id: '6', matricula: 'EMP-089', nome: 'Rafael Lima', telefone: '(55) 15 944443333', cargo: 'Operador', horarioEntrada: '22:00', horarioSaida: '06:00', usuario: 'RafaelLima', senha: 'Rafael123', acesso: 'Negado' },
  { id: '7', matricula: 'EMP-090', nome: 'Beatriz Alves', telefone: '(55) 15 933332222', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00', usuario: 'BeatrizAlves', senha: 'Beatriz123', acesso: 'Negado' },
  { id: '8', matricula: 'EMP-091', nome: 'Fernanda Dias', telefone: '(55) 15 922221111', cargo: 'Conferente', horarioEntrada: '09:00', horarioSaida: '18:00', usuario: 'FernandaDias', senha: 'Fernanda123', acesso: 'Negado' },
  { id: '9', matricula: 'EMP-092', nome: 'Paulo Nunes', telefone: '(55) 15 911110000', cargo: 'Operador', horarioEntrada: '07:00', horarioSaida: '16:00', usuario: 'PauloNunes', senha: 'Paulo12345', acesso: 'Negado' },
  { id: '10', matricula: 'EMP-093', nome: 'Larissa Rocha', telefone: '(55) 15 900009999', cargo: 'Ajudante', horarioEntrada: '08:00', horarioSaida: '17:00', usuario: 'LarissaRocha', senha: 'Larissa123', acesso: 'Negado' },
  { id: '11', matricula: 'EMP-094', nome: 'Diego Martins', telefone: '(55) 15 988880000', cargo: 'Conferente', horarioEntrada: '14:00', horarioSaida: '22:00', usuario: 'DiegoMartins', senha: 'Diego12345', acesso: 'Negado' },
]

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

export function nextEmployeeCode(employees: Employee[]): string {
  const highest = employees.reduce((max, { matricula }) => Math.max(max, Number(matricula.replace(/\D/g, '')) || 0), 0)
  return `EMP-${String(highest + 1).padStart(3, '0')}`
}

export function isUsernameTaken(employees: Employee[], usuario: string, ignoreId?: string): boolean {
  const wanted = usuario.trim().toLowerCase()
  return employees.some((employee) => employee.id !== ignoreId && employee.usuario.toLowerCase() === wanted)
}

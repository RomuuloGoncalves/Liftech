import { describe, expect, it } from 'vitest'
import {
  EMPLOYEES,
  SECTORS,
  filterEmployees,
  filterSectors,
  isUsernameTaken,
  nextEmployeeCode,
  type Employee,
} from '../../data/team'

const make = (overrides: Partial<Employee>): Employee => ({
  id: 'x',
  matricula: 'EMP-001',
  nome: 'Fulano',
  telefone: '',
  cargo: 'Ajudante',
  horarioEntrada: '',
  horarioSaida: '',
  usuario: 'fulano',
  senha: 'senha',
  acesso: 'Permitido',
  ...overrides,
})

describe('team mock dataset', () => {
  it('has 11 employees with both access values and 8 sectors', () => {
    expect(EMPLOYEES).toHaveLength(11)
    expect(EMPLOYEES.some((e) => e.acesso === 'Permitido')).toBe(true)
    expect(EMPLOYEES.some((e) => e.acesso === 'Negado')).toBe(true)
    expect(SECTORS).toHaveLength(8)
  })

  it('has unique employee ids, matriculas and usuarios', () => {
    expect(new Set(EMPLOYEES.map((e) => e.id)).size).toBe(EMPLOYEES.length)
    expect(new Set(EMPLOYEES.map((e) => e.matricula)).size).toBe(EMPLOYEES.length)
    expect(new Set(EMPLOYEES.map((e) => e.usuario.toLowerCase())).size).toBe(EMPLOYEES.length)
  })
})

describe('filterEmployees', () => {
  const list = [
    make({ id: '1', nome: 'Carlos Silva', matricula: 'EMP-010', cargo: 'Operador', acesso: 'Permitido' }),
    make({ id: '2', nome: 'Ana Souza', matricula: 'EMP-011', cargo: 'Ajudante', acesso: 'Negado' }),
    make({ id: '3', nome: 'Carla Dias', matricula: 'EMP-012', cargo: 'Ajudante', acesso: 'Negado' }),
  ]

  it('returns everyone when no filters are given', () => {
    expect(filterEmployees(list, {})).toHaveLength(3)
  })

  it('matches nome, ignoring case', () => {
    expect(filterEmployees(list, { query: 'CARLOS' }).map((e) => e.id)).toEqual(['1'])
  })

  it('matches matricula, ignoring case', () => {
    expect(filterEmployees(list, { query: 'emp-011' }).map((e) => e.id)).toEqual(['2'])
  })

  it('matches cargo', () => {
    expect(filterEmployees(list, { query: 'ajudante' }).map((e) => e.id)).toEqual(['2', '3'])
  })

  it('ignores surrounding whitespace in the query', () => {
    expect(filterEmployees(list, { query: '  ana  ' }).map((e) => e.id)).toEqual(['2'])
  })

  it('filters by access', () => {
    expect(filterEmployees(list, { access: 'Negado' }).map((e) => e.id)).toEqual(['2', '3'])
    expect(filterEmployees(list, { access: 'Permitido' }).map((e) => e.id)).toEqual(['1'])
  })

  it('treats access "Todos" as no filter', () => {
    expect(filterEmployees(list, { access: 'Todos' })).toHaveLength(3)
  })

  it('applies query and access together', () => {
    expect(filterEmployees(list, { query: 'car', access: 'Negado' }).map((e) => e.id)).toEqual(['3'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterEmployees(list, { query: 'zzz' })).toEqual([])
  })
})

describe('filterSectors', () => {
  const list = [
    { id: '1', nome: 'Expedição - Bloco B', unidade: 'Unidade Votorantin' },
    { id: '2', nome: 'Recebimento', unidade: 'Unidade Centro' },
  ]

  it('returns everything when the query is empty', () => {
    expect(filterSectors(list, {})).toHaveLength(2)
  })

  it('matches nome, ignoring case', () => {
    expect(filterSectors(list, { query: 'expedição' }).map((s) => s.id)).toEqual(['1'])
  })

  it('matches unidade', () => {
    expect(filterSectors(list, { query: 'centro' }).map((s) => s.id)).toEqual(['2'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterSectors(list, { query: 'zzz' })).toEqual([])
  })
})

describe('nextEmployeeCode', () => {
  it('returns EMP-001 for an empty list', () => {
    expect(nextEmployeeCode([])).toBe('EMP-001')
  })

  it('returns the highest matricula plus one, padded to 3 digits', () => {
    const list = [make({ matricula: 'EMP-009' }), make({ matricula: 'EMP-084' }), make({ matricula: 'EMP-010' })]
    expect(nextEmployeeCode(list)).toBe('EMP-085')
  })
})

describe('isUsernameTaken', () => {
  const list = [make({ id: '1', usuario: 'AlexandreMattos' }), make({ id: '2', usuario: 'ana' })]

  it('detects an existing usuario, ignoring case', () => {
    expect(isUsernameTaken(list, 'alexandremattos')).toBe(true)
  })

  it('returns false for a free usuario', () => {
    expect(isUsernameTaken(list, 'carlos')).toBe(false)
  })

  it('ignores the employee being edited', () => {
    expect(isUsernameTaken(list, 'AlexandreMattos', '1')).toBe(false)
    expect(isUsernameTaken(list, 'ana', '1')).toBe(true)
  })
})

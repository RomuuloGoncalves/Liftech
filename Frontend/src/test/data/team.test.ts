import { describe, expect, it } from 'vitest'
import * as team from '../../data/team'
import { SECTORS, filterEmployees, filterSectors, isUsernameTaken } from '../../data/team'
import { employee as make } from '../fixtures/employees'

describe('team mock dataset', () => {
  it('keeps the 8 mock sectors', () => {
    expect(SECTORS).toHaveLength(8)
    expect(new Set(SECTORS.map((s) => s.id)).size).toBe(8)
  })

  it('no longer ships a mock employee list nor generates matriculas (the API does)', () => {
    expect('EMPLOYEES' in team).toBe(false)
    expect('nextEmployeeCode' in team).toBe(false)
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

  it('skips employees without a login', () => {
    const withoutLogin = [make({ id: '3', usuario: null }), ...list]
    expect(isUsernameTaken(withoutLogin, 'carlos')).toBe(false)
    expect(isUsernameTaken(withoutLogin, 'ana')).toBe(true)
  })
})

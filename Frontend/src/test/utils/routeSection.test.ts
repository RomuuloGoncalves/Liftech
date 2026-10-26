import { describe, expect, it } from 'vitest'
import { routeSection } from '../../utils/routeSection'

describe('routeSection', () => {
  it.each([
    ['/funcionario', 'overview'],
    ['/funcionario/', 'overview'],
    ['/funcionario/maquinas', 'maquinas'],
    ['/funcionario/maquinas/3', 'maquinas'],
    ['/funcionario/historico', 'historico'],
    ['/funcionario/sessao', 'sessao'],
    ['/funcionario/ocorrencia', 'ocorrencia'],
    ['/funcionario/configuracoes', 'configuracoes'],
    ['/outra/rota', '/outra/rota'],
    ['/funcionario/desconhecida', '/funcionario/desconhecida'],
  ])('%s -> %s', (path, section) => {
    expect(routeSection(path)).toBe(section)
  })
})

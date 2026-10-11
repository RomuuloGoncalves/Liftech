import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import TabBar from '../../../components/employee/TabBar'
import styles from '../../../components/employee/TabBar.module.css'

const Where = () => <output data-testid="where">{useLocation().pathname}</output>

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <TabBar />
      <Where />
    </MemoryRouter>
  )

const TABS = ['Visão geral', 'Empilhadeiras', 'Histórico', 'Ocorrência']

describe('TabBar', () => {
  it('renders the 4 tabs in order', () => {
    renderAt('/funcionario')
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(TABS)
  })

  it.each([
    ['/funcionario', 'Visão geral'],
    ['/funcionario/maquinas', 'Empilhadeiras'],
    ['/funcionario/maquinas/3', 'Empilhadeiras'],
    ['/funcionario/historico', 'Histórico'],
    ['/funcionario/ocorrencia', 'Ocorrência'],
  ])('at %s only "%s" is active', (path, active) => {
    renderAt(path)
    for (const name of TABS) {
      const link = screen.getByRole('link', { name })
      if (name === active) expect(link).toHaveClass(styles.active)
      else expect(link).not.toHaveClass(styles.active)
    }
  })

  it('no tab is active on /funcionario/sessao except none matching', () => {
    renderAt('/funcionario/sessao')
    expect(screen.getByRole('link', { name: 'Visão geral' })).not.toHaveClass(styles.active)
  })

  it('tapping a tab navigates to its route', () => {
    renderAt('/funcionario')
    const targets: Array<[string, string]> = [
      ['Empilhadeiras', '/funcionario/maquinas'],
      ['Histórico', '/funcionario/historico'],
      ['Ocorrência', '/funcionario/ocorrencia'],
      ['Visão geral', '/funcionario'],
    ]
    for (const [name, path] of targets) {
      fireEvent.click(screen.getByRole('link', { name }))
      expect(screen.getByTestId('where')).toHaveTextContent(new RegExp(`^${path}$`))
    }
  })
})

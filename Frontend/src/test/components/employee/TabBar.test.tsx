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

const TABS = ['Visão geral', 'Empilhadeiras', 'Histórico']

describe('TabBar', () => {
  it('renders the 3 tabs in order', () => {
    renderAt('/funcionario')
    const links = screen.getAllByRole('link')
    expect(links.map((link) => link.getAttribute('aria-label'))).toEqual(TABS)
  })

  it('uses the House icon on the first tab and has no link to the incident route', () => {
    const { container } = renderAt('/funcionario')
    expect(screen.getByRole('link', { name: 'Visão geral' }).querySelector('svg')).toHaveClass('lucide-house')
    expect(container.querySelector('a[href="/funcionario/ocorrencia"]')).toBeNull()
  })

  it.each([
    ['/funcionario', 'Visão geral'],
    ['/funcionario/maquinas', 'Empilhadeiras'],
    ['/funcionario/maquinas/3', 'Empilhadeiras'],
    ['/funcionario/historico', 'Histórico'],
  ])('at %s only "%s" is active', (path, active) => {
    renderAt(path)
    for (const name of TABS) {
      const link = screen.getByRole('link', { name })
      if (name === active) expect(link).toHaveClass(styles.active)
      else expect(link).not.toHaveClass(styles.active)
    }
  })

  it.each([
    ['/funcionario', 'Visão geral', '0'],
    ['/funcionario/maquinas', 'Empilhadeiras', '1'],
    ['/funcionario/maquinas/3', 'Empilhadeiras', '1'],
    ['/funcionario/historico', 'Histórico', '2'],
  ])('at %s the single indicator sits at the "%s" tab (index %s)', (path, name, index) => {
    renderAt(path)
    expect(screen.getAllByTestId('tab-indicator')).toHaveLength(1)
    const indicator = screen.getByTestId('tab-indicator')
    expect(indicator).toHaveAttribute('aria-hidden', 'true')
    expect(indicator).not.toHaveClass(styles.hidden)
    expect(indicator.style.getPropertyValue('--tab-index')).toBe(index)
    expect(screen.getByRole('link', { name })).toHaveAttribute('aria-current', 'page')
  })

  it.each(['/funcionario/ocorrencia', '/funcionario/sessao', '/funcionario/configuracoes'])(
    'indicator is hidden at %s and no tab has aria-current',
    (path) => {
      renderAt(path)
      expect(screen.getByTestId('tab-indicator')).toHaveClass(styles.hidden)
      for (const name of TABS) {
        expect(screen.getByRole('link', { name })).not.toHaveAttribute('aria-current')
      }
    }
  )

  it('indicator moves to the tapped tab', () => {
    renderAt('/funcionario')
    fireEvent.click(screen.getByRole('link', { name: 'Histórico' }))
    expect(screen.getByTestId('tab-indicator').style.getPropertyValue('--tab-index')).toBe('2')
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
      ['Visão geral', '/funcionario'],
    ]
    for (const [name, path] of targets) {
      fireEvent.click(screen.getByRole('link', { name }))
      expect(screen.getByTestId('where')).toHaveTextContent(new RegExp(`^${path}$`))
    }
  })
})

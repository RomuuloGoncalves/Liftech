import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../../../App'

const Path = () => <output data-testid="path">{useLocation().pathname}</output>

const renderAt = (path: string, entries: string[] = [path]) =>
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.indexOf(path)}>
      <App />
      <Path />
    </MemoryRouter>
  )

const tabs = () => screen.getByRole('navigation', { name: 'Navegação do funcionário' })
const tab = (name: string) => screen.getByRole('link', { name })
const path = () => screen.getByTestId('path').textContent

describe('Employee layout', () => {
  it('renders without the admin Sidebar and Header', () => {
    renderAt('/funcionario')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Selecionar idioma' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument()
  })

  it('shows 3 tabs with their labels', () => {
    renderAt('/funcionario')
    const labels = ['Visão geral', 'Empilhadeiras', 'Histórico']
    labels.forEach((l) => expect(tab(l)).toBeInTheDocument())
    expect(tabs().querySelectorAll('a')).toHaveLength(3)
  })

  it('marks only the current route tab with aria-current', () => {
    renderAt('/funcionario/historico')
    expect(tab('Histórico')).toHaveAttribute('aria-current', 'page')
    for (const l of ['Visão geral', 'Empilhadeiras']) {
      expect(tab(l)).not.toHaveAttribute('aria-current')
    }
  })

  it('keeps Empilhadeiras active on a machine detail route and Visão geral inactive', () => {
    renderAt('/funcionario/maquinas/abc')
    expect(tab('Empilhadeiras')).toHaveAttribute('aria-current', 'page')
    expect(tab('Visão geral')).not.toHaveAttribute('aria-current')
  })

  it('navigates when a tab is clicked', () => {
    renderAt('/funcionario')
    fireEvent.click(tab('Empilhadeiras'))
    expect(path()).toBe('/funcionario/maquinas')
    expect(tab('Empilhadeiras')).toHaveAttribute('aria-current', 'page')
  })

  it('alert button opens the incident route', () => {
    renderAt('/funcionario')
    fireEvent.click(screen.getByRole('button', { name: 'Reportar uma ocorrência' }))
    expect(path()).toBe('/funcionario/ocorrencia')
  })

  it('blue button opens settings, shows X and goes back to the previous route', () => {
    renderAt('/funcionario/historico')
    fireEvent.click(screen.getByRole('button', { name: 'Abrir configurações' }))
    expect(path()).toBe('/funcionario/configuracoes')
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(path()).toBe('/funcionario/historico')
  })

  it('X falls back to /funcionario when there is no previous entry', () => {
    renderAt('/funcionario/configuracoes')
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(path()).toBe('/funcionario')
  })
})

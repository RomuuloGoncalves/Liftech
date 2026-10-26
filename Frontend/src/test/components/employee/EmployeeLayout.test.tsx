import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../../App'

const Path = () => <output data-testid="path">{useLocation().pathname}</output>

const renderAt = (path: string, entries: string[] = [path]) =>
  render(
    <MemoryRouter initialEntries={entries} initialIndex={entries.indexOf(path)}>
      <App />
      <Path />
    </MemoryRouter>
  )

const path = () => screen.getByTestId('path').textContent

describe('Employee layout', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify({ _id: 'u1', nome: 'Bruno', role: 'colaborador', operador: null }))
  })

  it.each([
    ['no stored user', null],
    ['an admin user', JSON.stringify({ _id: 'u2', nome: 'Ana', role: 'admin' })],
  ])('redirects to /login/colaborador with %s', async (_case, user) => {
    if (user) localStorage.setItem('user', user)
    else localStorage.removeItem('user')
    renderAt('/funcionario/historico')
    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(path()).toBe('/login/colaborador')
    expect(screen.queryByRole('navigation', { name: 'Navegação do funcionário' })).not.toBeInTheDocument()
  })

  it('renders without the admin Sidebar and Header', async () => {
    renderAt('/funcionario')
    expect(await screen.findByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Selecionar idioma' })).not.toBeInTheDocument()
  })

  it('shows 3 tabs with their labels', async () => {
    renderAt('/funcionario')
    const labels = ['Visão geral', 'Empilhadeiras', 'Histórico']
    for (const l of labels) {
      expect(await screen.findByRole('link', { name: l })).toBeInTheDocument()
    }
    const nav = await screen.findByRole('navigation', { name: 'Navegação do funcionário' })
    expect(nav.querySelectorAll('a')).toHaveLength(3)
  })

  it('marks only the current route tab with aria-current', async () => {
    renderAt('/funcionario/historico')
    const historicoTab = await screen.findByRole('link', { name: 'Histórico' })
    expect(historicoTab).toHaveAttribute('aria-current', 'page')
    for (const l of ['Visão geral', 'Empilhadeiras']) {
      expect(screen.getByRole('link', { name: l })).not.toHaveAttribute('aria-current')
    }
  })

  it('keeps Empilhadeiras active on a machine detail route and Visão geral inactive', async () => {
    renderAt('/funcionario/maquinas/abc')
    const empilhadeirasTab = await screen.findByRole('link', { name: 'Empilhadeiras' })
    expect(empilhadeirasTab).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Visão geral' })).not.toHaveAttribute('aria-current')
  })

  it('navigates when a tab is clicked', async () => {
    renderAt('/funcionario')
    const empilhadeirasTab = await screen.findByRole('link', { name: 'Empilhadeiras' })
    fireEvent.click(empilhadeirasTab)
    expect(path()).toBe('/funcionario/maquinas')
    expect(empilhadeirasTab).toHaveAttribute('aria-current', 'page')
  })

  it('alert button opens the incident route', async () => {
    renderAt('/funcionario')
    const alertBtn = await screen.findByRole('button', { name: 'Reportar uma ocorrência' })
    fireEvent.click(alertBtn)
    expect(path()).toBe('/funcionario/ocorrencia')
  })

  it('blue button opens settings, shows X and goes back to the previous route', async () => {
    renderAt('/funcionario/historico')
    const menuBtn = await screen.findByRole('button', { name: 'Abrir configurações' })
    fireEvent.click(menuBtn)
    expect(path()).toBe('/funcionario/configuracoes')
    const closeBtn = await screen.findByRole('button', { name: 'Fechar' })
    fireEvent.click(closeBtn)
    expect(path()).toBe('/funcionario/historico')
  })

  it('X falls back to /funcionario when there is no previous entry', async () => {
    renderAt('/funcionario/configuracoes')
    const closeBtn = await screen.findByRole('button', { name: 'Fechar' })
    fireEvent.click(closeBtn)
    expect(path()).toBe('/funcionario')
  })

  it('keeps header mounted when navigating between /funcionario and /funcionario/historico', async () => {
    renderAt('/funcionario')
    const alertBtn = await screen.findByRole('button', { name: 'Reportar uma ocorrência' })
    const header = alertBtn.closest('header')
    expect(header).toBeInTheDocument()

    const historicoTab = await screen.findByRole('link', { name: 'Histórico' })
    fireEvent.click(historicoTab)
    expect(path()).toBe('/funcionario/historico')

    // O header do EmployeeLayout continua exatamente o mesmo nó DOM montado
    expect(screen.getByRole('button', { name: 'Reportar uma ocorrência' }).closest('header')).toBe(header)
  })
})

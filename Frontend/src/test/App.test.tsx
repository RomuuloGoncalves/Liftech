import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from '../App'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )

describe('App shell visibility', () => {
  it('renders Sidebar and Header on an internal route', () => {
    renderAt('/')
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  })

  it('provides the active branch to the shell: selector and company row for a stored user', () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'u1',
        nome: 'Ana',
        role: 'admin',
        empresa: { _id: 'e1', nome: 'Acme Logística' },
        escopo: 'empresa',
        filiais: [{ _id: 'f1', nome: 'Filial 01', matriz: true }],
      })
    )
    renderAt('/frota')
    expect(screen.getByRole('button', { name: /Filiais/ })).toHaveTextContent('Todas as filiais')
    expect(screen.getByText('Acme Logística')).toBeInTheDocument()
  })

  it('hides Sidebar and Header on /login', () => {
    renderAt('/login')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
  })

  it('hides Sidebar and Header on /login/colaborador', () => {
    renderAt('/login/colaborador')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
  })

  it('hides Sidebar and Header on /solicitar-acesso', () => {
    renderAt('/solicitar-acesso')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Boas vindas à Liftech' })).toBeInTheDocument()
  })

  it.each(['/funcionario', '/funcionario/maquinas', '/funcionario/configuracoes'])(
    'hides the admin Sidebar and Header on %s and shows the employee shell',
    (path) => {
      renderAt(path)
      expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
      expect(screen.queryByRole('banner', { name: /./ })).not.toBeInTheDocument()
      expect(screen.getByRole('navigation', { name: 'Navegação do funcionário' })).toBeInTheDocument()
    }
  )

  it('hides the admin Sidebar on /funcionario and renders the employee shell', () => {
    renderAt('/funcionario')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Navegação do funcionário' })).toBeInTheDocument()
  })

  it('hides the admin Sidebar on a nested /funcionario route', () => {
    renderAt('/funcionario/maquinas')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
  })
})

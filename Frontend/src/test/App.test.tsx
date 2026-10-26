import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import App from '../App'

vi.mock('../services/accessRequestService', () => ({
  accessRequestService: {
    listar: vi.fn().mockResolvedValue([]),
    aprovar: vi.fn(),
    recusar: vi.fn(),
  },
}))

vi.mock('../services/incidentService', () => ({
  incidentService: {
    listar: vi.fn().mockResolvedValue([]),
    reportar: vi.fn(),
  },
}))

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  )

const asCollaborator = () =>
  localStorage.setItem('user', JSON.stringify({ _id: 'u1', nome: 'Bruno', role: 'colaborador', operador: null }))

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

  it('hides Sidebar and Header on /login', async () => {
    renderAt('/login')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
  })

  it('hides Sidebar and Header on /login/colaborador', async () => {
    renderAt('/login/colaborador')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
  })

  it('hides Sidebar and Header on /solicitar-acesso', async () => {
    renderAt('/solicitar-acesso')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Boas vindas à Liftech' })).toBeInTheDocument()
  })

  it('hides Sidebar and Header on /solicitacoes (ACCR-02 AC8)', async () => {
    renderAt('/solicitacoes')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('banner')).not.toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Solicitações de Acesso' })).toBeInTheDocument()
  })

  it.each(['/funcionario', '/funcionario/maquinas', '/funcionario/configuracoes'])(
    'hides the admin Sidebar and Header on %s and shows the employee shell',
    async (path) => {
      asCollaborator()
      renderAt(path)
      expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
      expect(screen.queryByRole('banner', { name: /./ })).not.toBeInTheDocument()
      expect(await screen.findByRole('navigation', { name: 'Navegação do funcionário' })).toBeInTheDocument()
    }
  )

  it('hides the admin Sidebar on /funcionario and renders the employee shell', async () => {
    asCollaborator()
    renderAt('/funcionario')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(await screen.findByRole('navigation', { name: 'Navegação do funcionário' })).toBeInTheDocument()
  })

  it('hides the admin Sidebar on a nested /funcionario route', async () => {
    asCollaborator()
    renderAt('/funcionario/maquinas')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(await screen.findByRole('navigation', { name: 'Navegação do funcionário' })).toBeInTheDocument()
  })

  it('consultas de incidentes acontecem na rota interna do shell (/) com sessão de admin', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'u1',
        nome: 'Admin',
        role: 'admin',
        empresa: { _id: 'e1', nome: 'Acme' },
        escopo: 'empresa',
        filiais: [],
      })
    )
    await act(async () => {
      renderAt('/')
    })
    const { incidentService } = await import('../services/incidentService')
    expect(incidentService.listar).toHaveBeenCalled()
  })

  it('não faz consultas de incidentes em rotas fora do shell (/login, /solicitacoes, /funcionario)', async () => {
    const { incidentService } = await import('../services/incidentService')
    const listarMock = vi.mocked(incidentService.listar)

    localStorage.setItem(
      'user',
      JSON.stringify({
        _id: 'u1',
        nome: 'Admin',
        role: 'admin',
        empresa: { _id: 'e1', nome: 'Acme' },
        escopo: 'empresa',
        filiais: [],
      })
    )

    for (const route of ['/login', '/solicitacoes', '/funcionario']) {
      listarMock.mockClear()
      await act(async () => {
        renderAt(route)
      })
      expect(listarMock).not.toHaveBeenCalled()
    }
  })
})

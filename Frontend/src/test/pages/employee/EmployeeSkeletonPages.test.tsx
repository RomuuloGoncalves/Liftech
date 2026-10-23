import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../../components/common/Toast'
import IncidentSheet from '../../../components/employee/IncidentSheet'
import EmployeeHistoryPage from '../../../pages/employee/EmployeeHistoryPage'
import EmployeeHomePage from '../../../pages/employee/EmployeeHomePage'
import EmployeeMachinesPage from '../../../pages/employee/EmployeeMachinesPage'
import EmployeeSessionPage from '../../../pages/employee/EmployeeSessionPage'
import EmployeeSettingsPage from '../../../pages/employee/EmployeeSettingsPage'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { MACHINES, type Machine } from '../../../data/machines'
import { sessionService, type Sessao } from '../../../services/sessionService'
import { machineService } from '../../../services/machineService'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn().mockResolvedValue([]) },
}))
vi.mock('../../../services/machineService', async () => {
  const { MACHINES } = await import('../../../data/machines')
  return { machineService: { listar: vi.fn().mockResolvedValue(MACHINES) } }
})

const atual = vi.mocked(sessionService.atual)
const listarSessoes = vi.mocked(sessionService.listar)
const listarMaquinas = vi.mocked(machineService.listar)

const at = (path: string, element: React.ReactElement, route = path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={element} />
        <Route path="/funcionario/maquinas" element={<p>redirected</p>} />
      </Routes>
    </MemoryRouter>
  )

const busy = () => document.querySelector('[aria-busy="true"]')

describe('employee screens skeleton', () => {
  beforeEach(() => {
    resetWorkSession()
    atual.mockReset().mockResolvedValue(null)
    listarSessoes.mockReset().mockResolvedValue([])
    listarMaquinas.mockReset().mockResolvedValue(MACHINES)
  })

  describe('data-fetching pages (Home, Machines, History)', () => {
    it('EmployeeHomePage shows skeleton while loading and content after resolution without timers', async () => {
      let resolve!: (val: Machine[]) => void
      listarMaquinas.mockReturnValue(new Promise<Machine[]>((r) => { resolve = r }))

      at('/funcionario', <EmployeeHomePage />)
      expect(busy()).not.toBeNull()
      expect(screen.getByRole('status')).toHaveTextContent('Carregando...')

      await act(async () => {
        resolve(MACHINES)
      })

      expect(busy()).toBeNull()
      expect(screen.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument()
    })

    it('EmployeeMachinesPage shows skeleton while loading and content after resolution without timers', async () => {
      let resolve!: (val: Machine[]) => void
      listarMaquinas.mockReturnValue(new Promise<Machine[]>((r) => { resolve = r }))

      at('/funcionario/maquinas', <EmployeeMachinesPage />, '/funcionario/maquinas/:id?')
      expect(busy()).not.toBeNull()
      expect(screen.getByRole('status')).toHaveTextContent('Carregando...')

      await act(async () => {
        resolve(MACHINES)
      })

      expect(busy()).toBeNull()
      expect(screen.getByRole('heading', { level: 1, name: 'Máquinas disponíveis' })).toBeInTheDocument()
    })

    it('EmployeeHistoryPage shows skeleton while loading and content after resolution without timers', async () => {
      let resolve!: (val: never[]) => void
      listarSessoes.mockReturnValue(new Promise<never[]>((r) => { resolve = r }))

      at('/funcionario/historico', <EmployeeHistoryPage />)
      expect(busy()).not.toBeNull()
      expect(screen.getByRole('status')).toHaveTextContent('Carregando...')

      await act(async () => {
        resolve([])
      })

      expect(busy()).toBeNull()
      expect(screen.getByRole('heading', { level: 1, name: 'Histórico' })).toBeInTheDocument()
    })
  })

  describe('EmployeeSessionPage', () => {
    it('shows skeleton while session is not ready, then content once resolved', async () => {
      let resolveSession!: (val: Sessao | null) => void
      atual.mockReturnValue(new Promise<Sessao | null>((r) => { resolveSession = r }))

      at('/funcionario/sessao', <EmployeeSessionPage />)
      expect(busy()).not.toBeNull()

      await act(async () => {
        resolveSession({
          _id: 's1',
          machineId: MACHINES[0].id,
          maquina: { nome: MACHINES[0].nome, identificacao: MACHINES[0].identificacao, setor: MACHINES[0].setor },
          operador: { nome: 'Carlos' },
          inicio: new Date().toISOString(),
          fim: null,
        })
      })

      expect(busy()).toBeNull()
      expect(screen.getByRole('timer')).toBeInTheDocument()
    })

    it('session without an active session redirects once resolved', async () => {
      atual.mockResolvedValue(null)
      at('/funcionario/sessao', <EmployeeSessionPage />)
      expect(await screen.findByText('redirected')).toBeInTheDocument()
    })
  })

  describe('EmployeeSettingsPage', () => {
    it('renders form directly without fake latency skeleton', () => {
      localStorage.setItem('user', JSON.stringify({ nome: 'Carlos', telefone: '123', cargo: 'Operador' }))
      at('/funcionario/configuracoes', <EmployeeSettingsPage />)
      expect(busy()).toBeNull()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('IncidentSheet', () => {
    it('shows skeleton while workSession is not ready and form when ready without timers', async () => {
      let resolveSession!: (val: Sessao | null) => void
      atual.mockReturnValue(new Promise<Sessao | null>((r) => { resolveSession = r }))

      render(
        <ToastProvider>
          <IncidentSheet open onClose={() => {}} />
        </ToastProvider>
      )

      const dialog = screen.getByRole('dialog', { name: 'Reporte uma ocorrência' })
      expect(dialog.querySelector('[aria-busy="true"]')).not.toBeNull()
      expect(dialog.querySelectorAll('[data-skeleton-field]')).toHaveLength(4)
      expect(screen.queryByLabelText('Setor')).not.toBeInTheDocument()

      await act(async () => {
        resolveSession(null)
      })

      expect(dialog.querySelector('[aria-busy="true"]')).toBeNull()
      expect(screen.getByLabelText('Setor')).toBeInTheDocument()
    })
  })
})

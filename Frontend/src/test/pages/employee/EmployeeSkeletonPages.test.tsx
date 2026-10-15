import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../../components/common/Toast'
import IncidentSheet from '../../../components/employee/IncidentSheet'
import EmployeeHistoryPage from '../../../pages/employee/EmployeeHistoryPage'
import EmployeeHomePage from '../../../pages/employee/EmployeeHomePage'
import EmployeeMachinesPage from '../../../pages/employee/EmployeeMachinesPage'
import EmployeeSessionPage from '../../../pages/employee/EmployeeSessionPage'
import EmployeeSettingsPage from '../../../pages/employee/EmployeeSettingsPage'
import { resetVisitedPages } from '../../../hooks/useFirstVisitLoading'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { MACHINES } from '../../../data/machines'
import { sessionService } from '../../../services/sessionService'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn() },
}))

const atual = vi.mocked(sessionService.atual)
const loadSession = () => act(async () => {})

const DELAY = 600

vi.mock('../../../hooks/useFirstVisitLoading', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../hooks/useFirstVisitLoading')>()
  return { ...actual, useFirstVisitLoading: (key: string) => actual.useFirstVisitLoading(key, 600) }
})

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
const finishLoading = () => act(() => vi.advanceTimersByTime(DELAY))

const screens: { name: string; render: () => unknown; content: () => HTMLElement }[] = [
  {
    name: 'EmployeeHomePage',
    render: () => at('/funcionario', <EmployeeHomePage />),
    content: () => screen.getByRole('heading', { level: 1, name: 'Visão geral' }),
  },
  {
    name: 'EmployeeMachinesPage',
    render: () => at('/funcionario/maquinas', <EmployeeMachinesPage />, '/funcionario/maquinas/:id?'),
    content: () => screen.getByRole('heading', { level: 1, name: 'Máquinas disponíveis' }),
  },
  {
    name: 'EmployeeHistoryPage',
    render: () => at('/funcionario/historico', <EmployeeHistoryPage />),
    content: () => screen.getByRole('heading', { level: 1, name: 'Histórico' }),
  },
  {
    name: 'EmployeeSessionPage',
    render: () => {
      atual.mockResolvedValue({
        _id: 's1',
        machineId: MACHINES[0].id,
        maquina: { nome: MACHINES[0].nome, identificacao: MACHINES[0].identificacao, setor: MACHINES[0].setor },
        operador: { nome: 'Carlos' },
        inicio: new Date().toISOString(),
        fim: null,
      })
      return at('/funcionario/sessao', <EmployeeSessionPage />)
    },
    content: () => screen.getByRole('timer'),
  },
  {
    name: 'EmployeeSettingsPage',
    render: () => at('/funcionario/configuracoes', <EmployeeSettingsPage />),
    content: () => screen.getByRole('heading', { level: 1 }),
  },
]

describe('employee screens skeleton', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetVisitedPages()
    resetWorkSession()
    atual.mockReset().mockResolvedValue(null)
  })
  afterEach(() => vi.useRealTimers())

  describe.each(screens)('$name', ({ render: open, content }) => {
    it('first visit shows the busy skeleton, then the content after the delay', async () => {
      open()
      await loadSession()
      expect(busy()).not.toBeNull()
      expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
      expect(() => content()).toThrow()
      finishLoading()
      expect(busy()).toBeNull()
      expect(content()).toBeInTheDocument()
    })

    it('second visit shows the content without skeleton', async () => {
      const first = open()
      await loadSession()
      finishLoading()
      ;(first as ReturnType<typeof render>).unmount()
      open()
      await loadSession()
      expect(busy()).toBeNull()
      expect(content()).toBeInTheDocument()
    })
  })

  it('session without an active session still redirects while loading', async () => {
    at('/funcionario/sessao', <EmployeeSessionPage />)
    await loadSession()
    expect(screen.getByText('redirected')).toBeInTheDocument()
  })

  it('settings first visit shows the settings skeleton (3 data fields, 2 buttons) instead of the form', () => {
    at('/funcionario/configuracoes', <EmployeeSettingsPage />)
    expect(busy()!.querySelectorAll('[data-skeleton-field]')).toHaveLength(3)
    expect(busy()!.querySelectorAll('[data-skeleton-button]')).toHaveLength(2)
    expect(screen.queryByLabelText('Nome')).not.toBeInTheDocument()
    finishLoading()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('machine detail sheet opens normally after the first load', () => {
    at(`/funcionario/maquinas/${MACHINES[0].id}`, <EmployeeMachinesPage />, '/funcionario/maquinas/:id?')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    finishLoading()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  describe('IncidentSheet', () => {
    const open = () =>
      render(
        <ToastProvider>
          <IncidentSheet open onClose={() => {}} />
        </ToastProvider>
      )

    it('first visit opens the sheet with the 4 skeleton fields instead of the form', async () => {
      open()
      await loadSession()
      const dialog = screen.getByRole('dialog', { name: 'Reporte uma ocorrência' })
      expect(dialog.querySelector('[aria-busy="true"]')).not.toBeNull()
      expect(dialog.querySelectorAll('[data-skeleton-field]')).toHaveLength(4)
      expect(screen.queryByLabelText('Setor')).not.toBeInTheDocument()
      finishLoading()
      expect(dialog.querySelector('[aria-busy="true"]')).toBeNull()
      expect(screen.getByLabelText('Setor')).toBeInTheDocument()
    })

    it('second visit shows the form without skeleton', async () => {
      const first = open()
      await loadSession()
      finishLoading()
      first.unmount()
      open()
      expect(busy()).toBeNull()
      expect(screen.getByLabelText('Setor')).toBeInTheDocument()
    })
  })
})

import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../../components/common/Toast'
import EmployeeSessionPage from '../../../pages/employee/EmployeeSessionPage'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { sessionService } from '../../../services/sessionService'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn() },
}))

const atual = vi.mocked(sessionService.atual)
const encerrar = vi.mocked(sessionService.encerrar)

const START = new Date('2026-01-01T10:00:00Z').getTime()

const sessao = (inicio = START) => ({
  _id: 's1',
  machineId: 'm1',
  maquina: { nome: 'Titan-X', identificacao: 'EMP-081', setor: 'Expedição' },
  operador: { nome: 'Carlos' },
  inicio: new Date(inicio).toISOString(),
  fim: null,
})

const setup = async () => {
  const view = render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/funcionario/sessao']}>
        <Routes>
          <Route path="/funcionario" element={<p>home</p>} />
          <Route path="/funcionario/maquinas" element={<p>maquinas</p>} />
          <Route path="/funcionario/ocorrencia" element={<p>ocorrencia</p>} />
          <Route path="/funcionario/sessao" element={<EmployeeSessionPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  )
  await act(async () => {})
  return view
}

const seed = (inicio = START) => atual.mockResolvedValue(sessao(inicio))
const endButton = () => screen.getByRole('button', { name: /Encerrar Sessão/ })

describe('EmployeeSessionPage', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(START + 30_000)
    resetWorkSession()
    atual.mockReset().mockResolvedValue(null)
    encerrar.mockReset()
  })

  afterEach(() => vi.useRealTimers())

  it('shows the elapsed time since the API inicio and keeps counting', async () => {
    seed()
    await setup()
    expect(screen.getByRole('timer', { name: 'Tempo de sessão' })).toHaveTextContent('00:00:30')
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('00:00:35')
  })

  it('recovers the open session from the API after a reload', async () => {
    seed(START - 3600_000)
    const first = await setup()
    expect(screen.getByRole('timer')).toHaveTextContent('01:00:30')
    first.unmount()
    resetWorkSession()
    vi.setSystemTime(START + 90_000)
    await setup()
    expect(screen.getByRole('timer')).toHaveTextContent('01:01:30')
    expect(atual).toHaveBeenCalledTimes(2)
  })

  it('ends the session through the API and goes to /funcionario', async () => {
    seed()
    encerrar.mockResolvedValue({ ...sessao(), fim: new Date().toISOString() })
    await setup()
    await act(async () => {
      fireEvent.click(endButton())
    })
    expect(encerrar).toHaveBeenCalledTimes(1)
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('keeps the session and shows the error toast when ending fails', async () => {
    seed()
    encerrar.mockRejectedValue(new Error('500'))
    await setup()
    await act(async () => {
      fireEvent.click(endButton())
    })
    expect(screen.getByText('Não foi possível encerrar a sessão. Tente novamente.')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(endButton()).not.toBeDisabled()
    expect(screen.queryByText('home')).not.toBeInTheDocument()
  })

  it('reports an incident without ending the session', async () => {
    seed()
    await setup()
    fireEvent.click(screen.getByRole('button', { name: /Reportar uma ocorrência/ }))
    expect(screen.getByText('ocorrencia')).toBeInTheDocument()
    expect(encerrar).not.toHaveBeenCalled()
  })

  it('redirects to /funcionario/maquinas without an open session', async () => {
    await setup()
    expect(screen.getByText('maquinas')).toBeInTheDocument()
  })
})

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SessionBar from '../../../components/employee/SessionBar'
import { resetWorkSession, useWorkSession } from '../../../hooks/useWorkSession'
import { sessionService, type Sessao } from '../../../services/sessionService'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn() },
}))

const atual = vi.mocked(sessionService.atual)
const NOW = new Date('2026-10-10T10:00:00Z').getTime()
const maquina = { nome: 'Empilhadeira Elétrica Titan-X', identificacao: 'EMP-081', setor: 'Expedição' }

const sessao = (inicio = NOW, m: Sessao['maquina'] = maquina): Sessao => ({
  _id: 's1',
  machineId: 'm1',
  maquina: m,
  operador: { nome: 'Carlos' },
  inicio: new Date(inicio).toISOString(),
  fim: null,
})

const Where = () => <output data-testid="where">{useLocation().pathname}</output>

const renderAt = async (path: string) => {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <SessionBar />
      <Where />
    </MemoryRouter>
  )
  await act(async () => {})
  return view
}

const seed = (inicio = NOW, m?: Sessao['maquina']) => atual.mockResolvedValue(sessao(inicio, m))

const bar = () => screen.queryByRole('link', { name: /Sessão em andamento/ })

describe('SessionBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    resetWorkSession()
    atual.mockReset().mockResolvedValue(null)
  })
  afterEach(() => vi.useRealTimers())

  it.each(['/funcionario', '/funcionario/maquinas'])('shows machine name and 00:00:00 at %s', async (path) => {
    seed()
    await renderAt(path)
    expect(bar()).toBeInTheDocument()
    expect(screen.getByText(maquina.nome)).toBeInTheDocument()
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('advances the stopwatch every second', async () => {
    seed()
    await renderAt('/funcionario')
    act(() => {
      vi.advanceTimersByTime(65_000)
    })
    expect(screen.getByText('00:01:05')).toBeInTheDocument()
  })

  it('tapping navigates to /funcionario/sessao', async () => {
    seed()
    await renderAt('/funcionario/historico')
    fireEvent.click(bar()!)
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/sessao')
  })

  it('is hidden without a session', async () => {
    await renderAt('/funcionario')
    expect(bar()).not.toBeInTheDocument()
  })

  it('is hidden at /funcionario/sessao', async () => {
    seed()
    await renderAt('/funcionario/sessao')
    expect(bar()).not.toBeInTheDocument()
  })

  it('disappears when the session ends', async () => {
    seed()
    vi.mocked(sessionService.encerrar).mockResolvedValue(sessao())
    await renderAt('/funcionario')
    expect(bar()).toBeInTheDocument()
    const { result } = renderHook(() => useWorkSession())
    await act(async () => {
      await result.current.end()
    })
    expect(bar()).not.toBeInTheDocument()
  })

  it('appears when a session starts', async () => {
    vi.mocked(sessionService.iniciar).mockResolvedValue(sessao())
    await renderAt('/funcionario')
    expect(bar()).not.toBeInTheDocument()
    const { result } = renderHook(() => useWorkSession())
    await act(async () => {
      await result.current.start('m1')
    })
    expect(bar()).toBeInTheDocument()
  })

  it('shows only title and stopwatch when the machine was deleted', async () => {
    seed(NOW - 3_000, null)
    await renderAt('/funcionario')
    expect(bar()).toHaveAccessibleName('Sessão em andamento - 00:00:03')
    expect(bar()).toHaveTextContent('Sessão em andamento00:00:03')
  })

  it('survives a reload with an old inicio', async () => {
    seed(NOW - 3_725_000)
    const { unmount } = await renderAt('/funcionario')
    unmount()
    resetWorkSession()
    await renderAt('/funcionario/maquinas')
    expect(screen.getByText('01:02:05')).toBeInTheDocument()
    expect(screen.getByText(maquina.nome)).toBeInTheDocument()
  })
})

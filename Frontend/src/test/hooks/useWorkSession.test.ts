import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatElapsed, resetWorkSession, useWorkSession } from '../../hooks/useWorkSession'
import { sessionService } from '../../services/sessionService'

vi.mock('../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn() },
}))

const atual = vi.mocked(sessionService.atual)
const iniciar = vi.mocked(sessionService.iniciar)
const encerrar = vi.mocked(sessionService.encerrar)

const NOW = new Date('2026-10-10T10:00:00Z').getTime()

const sessao = (machineId: string, inicio = NOW) => ({
  _id: `s-${machineId}`,
  machineId,
  maquina: { nome: 'Titan-X', identificacao: 'EMP-081', setor: 'Expedição' },
  operador: { nome: 'Carlos Silva' },
  inicio: new Date(inicio).toISOString(),
  fim: null,
})

describe('formatElapsed', () => {
  it('formats seconds as HH:MM:SS', () => {
    expect(formatElapsed(0)).toBe('00:00:00')
    expect(formatElapsed(59)).toBe('00:00:59')
    expect(formatElapsed(30 * 60 + 25)).toBe('00:30:25')
    expect(formatElapsed(3600 + 61)).toBe('01:01:01')
  })

  it('never returns negative or fractional values', () => {
    expect(formatElapsed(-5)).toBe('00:00:00')
    expect(formatElapsed(1.9)).toBe('00:00:01')
  })
})

describe('useWorkSession', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.setSystemTime(NOW)
    resetWorkSession()
    atual.mockReset().mockResolvedValue(null)
    iniciar.mockReset()
    encerrar.mockReset()
  })
  afterEach(() => vi.useRealTimers())

  it('loads the open session once from the API and is not ready before', async () => {
    const { result } = renderHook(() => useWorkSession())
    renderHook(() => useWorkSession())
    expect(result.current.ready).toBe(false)
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.session).toBeNull()
    expect(result.current.elapsedSeconds).toBe(0)
    expect(atual).toHaveBeenCalledTimes(1)
  })

  it('recovers the open session after a reload and counts from inicio', async () => {
    atual.mockResolvedValue(sessao('3', NOW - (30 * 60 + 25) * 1000))
    const { result } = renderHook(() => useWorkSession())

    await waitFor(() => expect(result.current.session?.machineId).toBe('3'))
    expect(formatElapsed(result.current.elapsedSeconds)).toBe('00:30:25')
    act(() => vi.advanceTimersByTime(1000))
    expect(formatElapsed(result.current.elapsedSeconds)).toBe('00:30:26')
  })

  it('treats a failed load as no session', async () => {
    atual.mockRejectedValue(new Error('500'))
    const { result } = renderHook(() => useWorkSession())
    await waitFor(() => expect(result.current.ready).toBe(true))
    expect(result.current.session).toBeNull()
  })

  it('loads again for a new login token', async () => {
    const { result, unmount } = renderHook(() => useWorkSession())
    await waitFor(() => expect(result.current.ready).toBe(true))
    unmount()
    localStorage.setItem('token', 'other')
    renderHook(() => useWorkSession())
    expect(atual).toHaveBeenCalledTimes(2)
  })

  it('start posts the machine, shares the API session and counts seconds', async () => {
    iniciar.mockResolvedValue(sessao('5'))
    const a = renderHook(() => useWorkSession())
    const b = renderHook(() => useWorkSession())

    let ok = false
    await act(async () => {
      ok = await a.result.current.start('5')
    })

    expect(ok).toBe(true)
    expect(iniciar).toHaveBeenCalledWith('5')
    expect(b.result.current.session?.machineId).toBe('5')
    act(() => vi.advanceTimersByTime(3000))
    expect(a.result.current.elapsedSeconds).toBe(3)
  })

  it('start failing keeps no session and returns false', async () => {
    iniciar.mockRejectedValue(new Error('409'))
    const { result } = renderHook(() => useWorkSession())
    let ok = true
    await act(async () => {
      ok = await result.current.start('5')
    })
    expect(ok).toBe(false)
    expect(result.current.session).toBeNull()
  })

  it('end closes through the API and clears the session', async () => {
    atual.mockResolvedValue(sessao('3'))
    encerrar.mockResolvedValue({ ...sessao('3'), fim: new Date(NOW).toISOString() })
    const { result } = renderHook(() => useWorkSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())

    let ok = false
    await act(async () => {
      ok = await result.current.end()
    })

    expect(ok).toBe(true)
    expect(encerrar).toHaveBeenCalledTimes(1)
    expect(result.current.session).toBeNull()
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('end failing keeps the session and returns false', async () => {
    atual.mockResolvedValue(sessao('3'))
    encerrar.mockRejectedValue(new Error('500'))
    const { result } = renderHook(() => useWorkSession())
    await waitFor(() => expect(result.current.session).not.toBeNull())

    let ok = true
    await act(async () => {
      ok = await result.current.end()
    })

    expect(ok).toBe(false)
    expect(result.current.session?.machineId).toBe('3')
  })
})

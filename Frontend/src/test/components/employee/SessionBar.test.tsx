import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SessionBar from '../../../components/employee/SessionBar'
import { SESSION_STORAGE_KEY, useWorkSession } from '../../../hooks/useWorkSession'
import { MACHINES } from '../../../data/machines'

const machine = MACHINES[0]

const Where = () => <output data-testid="where">{useLocation().pathname}</output>

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SessionBar />
      <Where />
    </MemoryRouter>
  )

const seed = (machineId: string, startedAt = Date.now()) =>
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ machineId, startedAt }))

const bar = () => screen.queryByRole('link', { name: /Sessão em andamento/ })

describe('SessionBar', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
  })

  it.each(['/funcionario', '/funcionario/maquinas'])('shows machine name and 00:00:00 at %s', (path) => {
    seed(machine.id)
    renderAt(path)
    expect(bar()).toBeInTheDocument()
    expect(screen.getByText(machine.nome)).toBeInTheDocument()
    expect(screen.getByText('00:00:00')).toBeInTheDocument()
  })

  it('advances the stopwatch every second', () => {
    seed(machine.id)
    renderAt('/funcionario')
    act(() => {
      vi.advanceTimersByTime(65_000)
    })
    expect(screen.getByText('00:01:05')).toBeInTheDocument()
  })

  it('tapping navigates to /funcionario/sessao', () => {
    seed(machine.id)
    renderAt('/funcionario/historico')
    fireEvent.click(bar()!)
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/sessao')
  })

  it('is hidden without a session', () => {
    renderAt('/funcionario')
    expect(bar()).not.toBeInTheDocument()
  })

  it('is hidden at /funcionario/sessao', () => {
    seed(machine.id)
    renderAt('/funcionario/sessao')
    expect(bar()).not.toBeInTheDocument()
  })

  it('disappears when the session ends', () => {
    seed(machine.id)
    renderAt('/funcionario')
    expect(bar()).toBeInTheDocument()
    const { result } = renderHook(() => useWorkSession())
    act(() => result.current.end())
    expect(bar()).not.toBeInTheDocument()
  })

  it('appears when a session starts', () => {
    renderAt('/funcionario')
    expect(bar()).not.toBeInTheDocument()
    const { result } = renderHook(() => useWorkSession())
    act(() => result.current.start(machine.id))
    expect(bar()).toBeInTheDocument()
  })

  it('shows only title and stopwatch for an unknown machine', () => {
    seed('does-not-exist', Date.now() - 3_000)
    renderAt('/funcionario')
    expect(bar()).toHaveAccessibleName('Sessão em andamento - 00:00:03')
    expect(bar()).toHaveTextContent('Sessão em andamento00:00:03')
  })

  it('survives a reload with an old startedAt', () => {
    seed(machine.id, Date.now() - 3_725_000)
    const { unmount } = renderAt('/funcionario')
    unmount()
    renderAt('/funcionario/maquinas')
    expect(screen.getByText('01:02:05')).toBeInTheDocument()
    expect(screen.getByText(machine.nome)).toBeInTheDocument()
  })
})

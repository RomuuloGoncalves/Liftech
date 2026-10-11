import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EmployeeSessionPage from '../../../pages/employee/EmployeeSessionPage'
import { SESSION_STORAGE_KEY } from '../../../hooks/useWorkSession'

const START = new Date('2026-01-01T10:00:00Z').getTime()

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/funcionario/sessao']}>
      <Routes>
        <Route path="/funcionario" element={<p>home</p>} />
        <Route path="/funcionario/maquinas" element={<p>maquinas</p>} />
        <Route path="/funcionario/ocorrencia" element={<p>ocorrencia</p>} />
        <Route path="/funcionario/sessao" element={<EmployeeSessionPage />} />
      </Routes>
    </MemoryRouter>
  )

const seed = (startedAt = START) =>
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ machineId: 'm1', startedAt }))

describe('EmployeeSessionPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(START + 30_000)
  })

  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
  })

  it('shows the elapsed time since the stored start and keeps counting', () => {
    seed()
    setup()
    expect(screen.getByRole('timer', { name: 'Tempo de sessão' })).toHaveTextContent('00:00:30')
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByRole('timer')).toHaveTextContent('00:00:35')
  })

  it('continues from the stored start after remounting', () => {
    seed(START - 3600_000)
    const first = setup()
    expect(screen.getByRole('timer')).toHaveTextContent('01:00:30')
    first.unmount()
    vi.setSystemTime(START + 90_000)
    setup()
    expect(screen.getByRole('timer')).toHaveTextContent('01:01:30')
  })

  it('ends the session and goes to /funcionario', () => {
    seed()
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Encerrar Sessão/ }))
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
    expect(screen.getByText('home')).toBeInTheDocument()
  })

  it('reports an incident without ending the session', () => {
    seed()
    setup()
    fireEvent.click(screen.getByRole('button', { name: /Reportar uma ocorrência/ }))
    expect(screen.getByText('ocorrencia')).toBeInTheDocument()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).not.toBeNull()
  })

  it('redirects to /funcionario/maquinas without an active session', () => {
    setup()
    expect(screen.getByText('maquinas')).toBeInTheDocument()
  })
})

import { render, screen, act } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LiveProvider,
  useLive,
  useOnReconnect,
} from '../../context/LiveContext'
import {
  streamService,
  type StreamEventHandler,
  type StreamServiceOptions,
} from '../../services/streamService'
import * as activeBranchModule from '../../context/ActiveBranchContext'
import { authService, type UsuarioLogado } from '../../services/authService'

vi.mock('../../services/streamService', () => ({
  streamService: {
    abrir: vi.fn(),
  },
}))

describe('LiveContext and useLive (TLQ-05)', () => {
  let mockUser: UsuarioLogado | null = null
  let mockActiveBranch = 'todas'

  beforeEach(() => {
    vi.useFakeTimers()
    mockUser = {
      _id: 'u1',
      nome: 'Admin',
      role: 'admin',
      empresa: { _id: 'e1', nome: 'Liftech' },
      escopo: 'empresa',
      filiais: [],
    }
    mockActiveBranch = 'todas'

    vi.spyOn(activeBranchModule, 'useActiveBranch').mockImplementation(() => ({
      user: mockUser,
      branches: [],
      activeBranch: mockActiveBranch,
      setActiveBranch: vi.fn(),
      showAll: true,
      canManage: true,
      createBranch: vi.fn(),
      renameBranch: vi.fn(),
      removeBranch: vi.fn(),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('does not open stream when user is not logged in', async () => {
    mockUser = null

    render(
      <LiveProvider>
        <div>Content</div>
      </LiveProvider>
    )

    expect(streamService.abrir).not.toHaveBeenCalled()
  })

  it('opens stream when user is logged in', async () => {
    vi.mocked(streamService.abrir).mockImplementation(() => new Promise(() => {}))

    render(
      <LiveProvider>
        <div>Content</div>
      </LiveProvider>
    )

    expect(streamService.abrir).toHaveBeenCalledTimes(1)
  })

  it('aborts and closes stream on logout', async () => {
    let capturedSignal: AbortSignal | undefined

    vi.mocked(streamService.abrir).mockImplementation(
      (_onEvento: StreamEventHandler, opts?: AbortSignal | StreamServiceOptions) => {
        capturedSignal = opts && 'signal' in opts ? opts.signal : (opts as AbortSignal | undefined)
        return new Promise(() => {})
      }
    )

    const initialUser: UsuarioLogado = {
      _id: 'u1',
      nome: 'Admin',
      role: 'admin',
      empresa: { _id: 'e1', nome: 'Liftech' },
      escopo: 'empresa',
      filiais: [],
    }

    const Wrapper = () => {
      const [currentUser, setCurrentUser] = useState<UsuarioLogado | null>(initialUser)
      vi.spyOn(activeBranchModule, 'useActiveBranch').mockImplementation(() => ({
        user: currentUser,
        branches: [],
        activeBranch: 'todas',
        setActiveBranch: vi.fn(),
        showAll: true,
        canManage: true,
        createBranch: vi.fn(),
        renameBranch: vi.fn(),
        removeBranch: vi.fn(),
      }))

      return (
        <LiveProvider>
          <button onClick={() => setCurrentUser(null)}>Logout</button>
        </LiveProvider>
      )
    }

    render(<Wrapper />)
    expect(streamService.abrir).toHaveBeenCalledTimes(1)
    expect(capturedSignal?.aborted).toBe(false)

    act(() => {
      screen.getByText('Logout').click()
    })

    expect(capturedSignal?.aborted).toBe(true)
  })

  it('delivers events only to subscribers of that specific event type', async () => {
    let sseCallback: StreamEventHandler | undefined

    vi.mocked(streamService.abrir).mockImplementation((onEvento: StreamEventHandler) => {
      sseCallback = onEvento
      return new Promise(() => {})
    })

    const maquinaHandler = vi.fn()
    const incidenteHandler = vi.fn()

    const Consumer = () => {
      useLive('maquina', maquinaHandler)
      useLive('incidente', incidenteHandler)
      return <div>Listening</div>
    }

    render(
      <LiveProvider>
        <Consumer />
      </LiveProvider>
    )

    expect(sseCallback).toBeDefined()

    act(() => {
      sseCallback!({ event: 'maquina', data: { id: 'm1', status: 'alerta' } })
    })

    expect(maquinaHandler).toHaveBeenCalledTimes(1)
    expect(maquinaHandler).toHaveBeenCalledWith({ id: 'm1', status: 'alerta' })
    expect(incidenteHandler).not.toHaveBeenCalled()

    act(() => {
      sseCallback!({ event: 'incidente', data: { id: 'i1', tipo: 'colisao' } })
    })

    expect(incidenteHandler).toHaveBeenCalledTimes(1)
    expect(incidenteHandler).toHaveBeenCalledWith({ id: 'i1', tipo: 'colisao' })
    expect(maquinaHandler).toHaveBeenCalledTimes(1)
  })

  it('reconnects with increasing backoff delay on stream drop and triggers onReconnect', async () => {
    let callCount = 0
    let triggerOnOpen: (() => void) | undefined
    let resolveStream: (() => void) | undefined

    vi.mocked(streamService.abrir).mockImplementation(
      (_onEvento: StreamEventHandler, opts?: AbortSignal | StreamServiceOptions) => {
        callCount++
        triggerOnOpen = opts && 'onOpen' in opts ? opts.onOpen : undefined
        return new Promise((resolve) => {
          resolveStream = resolve
        })
      }
    )

    const reconnectSpy = vi.fn()

    const Consumer = () => {
      useOnReconnect(reconnectSpy)
      return <div>Consumer</div>
    }

    render(
      <LiveProvider>
        <Consumer />
      </LiveProvider>
    )

    expect(callCount).toBe(1)
    // First connection opens normally
    act(() => {
      triggerOnOpen?.()
    })
    // First open is NOT a reconnect
    expect(reconnectSpy).not.toHaveBeenCalled()

    // 1st drop: stream finishes
    act(() => {
      resolveStream?.()
    })
    await act(async () => {
      await Promise.resolve()
    })

    // Advance 1s (initial backoff delay = 1000ms)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callCount).toBe(2)

    // On reconnect success, triggers onReconnect callback
    act(() => {
      triggerOnOpen?.()
    })
    expect(reconnectSpy).toHaveBeenCalledTimes(1)

    // 2nd drop: stream finishes again
    act(() => {
      resolveStream?.()
    })
    await act(async () => {
      await Promise.resolve()
    })

    // Advance 2s (backoff doubled: 2000ms)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callCount).toBe(2) // Not yet reconnected at 1s

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callCount).toBe(3) // Reconnected at 2s

    act(() => {
      triggerOnOpen?.()
    })
    expect(reconnectSpy).toHaveBeenCalledTimes(2)
  })

  it('stops reconnecting and calls authService.logout on 401 Unauthorized', async () => {
    const logoutSpy = vi.spyOn(authService, 'logout').mockImplementation(() => {})
    const unauthorizedError = Object.assign(new Error('Unauthorized'), { status: 401 })
    vi.mocked(streamService.abrir).mockRejectedValueOnce(unauthorizedError)

    render(
      <LiveProvider>
        <div>Content</div>
      </LiveProvider>
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(streamService.abrir).toHaveBeenCalledTimes(1)
    expect(logoutSpy).toHaveBeenCalledTimes(1)

    // Advance time by 60 seconds - should NOT attempt to reconnect
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(streamService.abrir).toHaveBeenCalledTimes(1)
  })
})

import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEmployeeData } from '../../hooks/useEmployeeData'
import { machineService } from '../../services/machineService'
import { sessionService } from '../../services/sessionService'
import type { Machine } from '../../data/machines'
import type { Sessao } from '../../services/sessionService'

vi.mock('../../services/machineService', () => ({
  machineService: {
    listar: vi.fn(),
  },
}))

vi.mock('../../services/sessionService', () => ({
  sessionService: {
    listar: vi.fn(),
  },
}))

describe('useEmployeeData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts with loading: true while requests are pending', () => {
    vi.mocked(machineService.listar).mockReturnValue(new Promise(() => {}))
    vi.mocked(sessionService.listar).mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useEmployeeData())

    expect(result.current.loading).toBe(true)
    expect(result.current.machines).toEqual([])
    expect(result.current.records).toEqual([])
  })

  it('sets loading: false and populates data after both requests succeed', async () => {
    const mockMachines = [{ _id: 'm1', nome: 'Empilhadeira A' }] as unknown as Machine[]
    const mockSessions = [
      {
        _id: 's1',
        operador: { _id: 'op1', nome: 'Bruno' },
        empilhadeiraId: 'm1',
        inicio: '2026-10-23T10:00:00Z',
        fim: '2026-10-23T11:00:00Z',
      },
    ] as unknown as Sessao[]

    vi.mocked(machineService.listar).mockResolvedValue(mockMachines)
    vi.mocked(sessionService.listar).mockResolvedValue(mockSessions)

    const { result } = renderHook(() => useEmployeeData())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.machines).toEqual(mockMachines)
    expect(result.current.records).toHaveLength(1)
  })

  it('sets loading: false after requests fail (error)', async () => {
    vi.mocked(machineService.listar).mockRejectedValue(new Error('Network error'))
    vi.mocked(sessionService.listar).mockRejectedValue(new Error('Database error'))

    const { result } = renderHook(() => useEmployeeData())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.machines).toEqual([])
    expect(result.current.records).toEqual([])
  })

  it('sets loading: false when one succeeds and one fails', async () => {
    const mockMachines = [{ _id: 'm1', nome: 'Empilhadeira A' }] as unknown as Machine[]
    vi.mocked(machineService.listar).mockResolvedValue(mockMachines)
    vi.mocked(sessionService.listar).mockRejectedValue(new Error('Error'))

    const { result } = renderHook(() => useEmployeeData())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.machines).toEqual(mockMachines)
    expect(result.current.records).toEqual([])
  })
})

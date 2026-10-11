import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SESSION_STORAGE_KEY, formatElapsed, useWorkSession } from '../../hooks/useWorkSession'

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
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-10T10:00:00Z'))
    sessionStorage.clear()
    renderHook(() => useWorkSession()).result.current.end()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('has no session at first', () => {
    const { result } = renderHook(() => useWorkSession())
    expect(result.current.session).toBeNull()
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('starts a session, persists it in sessionStorage and counts seconds', () => {
    const { result } = renderHook(() => useWorkSession())
    act(() => result.current.start('3'))

    expect(result.current.session?.machineId).toBe('3')
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY) as string)).toEqual({
      machineId: '3',
      startedAt: Date.now(),
    })
    expect(result.current.elapsedSeconds).toBe(0)

    act(() => vi.advanceTimersByTime(3000))
    expect(result.current.elapsedSeconds).toBe(3)
  })

  it('clears the session on end', () => {
    const { result } = renderHook(() => useWorkSession())
    act(() => result.current.start('3'))
    act(() => result.current.end())

    expect(result.current.session).toBeNull()
    expect(result.current.elapsedSeconds).toBe(0)
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })

  it('shares the session between mounted components', () => {
    const a = renderHook(() => useWorkSession())
    const b = renderHook(() => useWorkSession())
    act(() => a.result.current.start('5'))
    expect(b.result.current.session?.machineId).toBe('5')

    act(() => b.result.current.end())
    expect(a.result.current.session).toBeNull()
  })

  it('keeps counting from the stored start after remounting', () => {
    sessionStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ machineId: '3', startedAt: Date.now() - (30 * 60 + 25) * 1000 })
    )
    const { result } = renderHook(() => useWorkSession())

    expect(result.current.session?.machineId).toBe('3')
    expect(formatElapsed(result.current.elapsedSeconds)).toBe('00:30:25')
    act(() => vi.advanceTimersByTime(1000))
    expect(formatElapsed(result.current.elapsedSeconds)).toBe('00:30:26')
  })

  it('ignores a corrupted stored value', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, '{not json')
    const { result } = renderHook(() => useWorkSession())
    expect(result.current.session).toBeNull()
  })

  it('works in memory when sessionStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    const { result } = renderHook(() => useWorkSession())
    expect(() => act(() => result.current.start('7'))).not.toThrow()
    expect(result.current.session?.machineId).toBe('7')

    act(() => vi.advanceTimersByTime(2000))
    expect(result.current.elapsedSeconds).toBe(2)

    act(() => result.current.end())
    expect(result.current.session).toBeNull()
  })
})

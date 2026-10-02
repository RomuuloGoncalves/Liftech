import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MOCK_LATENCY_MS, resetVisitedPages, useFirstVisitLoading } from '../../hooks/useFirstVisitLoading'

describe('useFirstVisitLoading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetVisitedPages()
  })
  afterEach(() => vi.useRealTimers())

  it('has no simulated latency in test mode', () => {
    expect(MOCK_LATENCY_MS).toBe(0)
  })

  it('is loading on the first visit and stops after the delay', () => {
    const { result } = renderHook(() => useFirstVisitLoading('frota', 600))
    expect(result.current).toBe(true)
    act(() => vi.advanceTimersByTime(599))
    expect(result.current).toBe(true)
    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe(false)
  })

  it('is not loading when the page was already visited', () => {
    const first = renderHook(() => useFirstVisitLoading('frota', 600))
    act(() => vi.advanceTimersByTime(600))
    first.unmount()

    const { result } = renderHook(() => useFirstVisitLoading('frota', 600))
    expect(result.current).toBe(false)
  })

  it('tracks each page separately', () => {
    renderHook(() => useFirstVisitLoading('frota', 600))
    act(() => vi.advanceTimersByTime(600))
    const { result } = renderHook(() => useFirstVisitLoading('equipe', 600))
    expect(result.current).toBe(true)
  })

  it('does not mark the page as visited when it unmounts before the delay', () => {
    const first = renderHook(() => useFirstVisitLoading('frota', 600))
    act(() => vi.advanceTimersByTime(300))
    first.unmount()
    act(() => vi.advanceTimersByTime(600))

    const { result } = renderHook(() => useFirstVisitLoading('frota', 600))
    expect(result.current).toBe(true)
  })

  it('is never loading with a zero delay', () => {
    const { result } = renderHook(() => useFirstVisitLoading('frota', 0))
    expect(result.current).toBe(false)
  })
})

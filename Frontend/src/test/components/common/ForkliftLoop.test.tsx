import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ForkliftLoop from '../../../components/common/ForkliftLoop'

const mockMotion = (reduce: boolean) => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('ForkliftLoop (NF2-03, NF2-04)', () => {
  afterEach(() => vi.restoreAllMocks())

  it('with reduced motion the video does not autoplay, stays at opacity 1 and runs no frame loop', () => {
    mockMotion(true)
    const raf = vi.spyOn(window, 'requestAnimationFrame')
    const { container } = render(<ForkliftLoop className="art" />)
    const video = container.querySelector('video')!
    expect(video.autoplay).toBe(false)
    expect(video.style.opacity).toBe('1')
    expect(video).toHaveClass('art')
    expect(raf).not.toHaveBeenCalled()
  })

  it('without reduced motion the video autoplays and the fade loop runs until unmount', () => {
    mockMotion(false)
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(7)
    const cancel = vi.spyOn(window, 'cancelAnimationFrame')
    const { container, unmount } = render(<ForkliftLoop />)
    expect(container.querySelector('video')!.autoplay).toBe(true)
    expect(raf).toHaveBeenCalled()
    unmount()
    expect(cancel).toHaveBeenCalledWith(7)
  })
})

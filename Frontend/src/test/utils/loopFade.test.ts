import { describe, expect, it } from 'vitest'
import { loopFade } from '../../utils/loopFade'

describe('loopFade', () => {
  it('is fully transparent on the first and last frame', () => {
    expect(loopFade(0, 1.85)).toBe(0)
    expect(loopFade(1.85, 1.85)).toBe(0)
  })

  it('is fully opaque between the fades', () => {
    expect(loopFade(0.9, 1.85)).toBe(1)
  })

  it('ramps linearly over the fade window on both edges', () => {
    expect(loopFade(0.15, 1.85, 0.3)).toBeCloseTo(0.5)
    expect(loopFade(1.7, 1.85, 0.3)).toBeCloseTo(0.5)
  })

  it('stays opaque while the duration is unknown', () => {
    expect(loopFade(0, NaN)).toBe(1)
    expect(loopFade(0, 0)).toBe(1)
  })
})

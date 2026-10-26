import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const rootCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const splashCss = readFileSync(
  resolve(process.cwd(), 'src/components/common/SplashGate.module.css'),
  'utf8'
)

const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('Splash styles (SPL-01)', () => {
  it('declares --gradient-brand in index.css with #41b0ff and #4652ef', () => {
    expect(rootCss).toMatch(/--gradient-brand:\s*linear-gradient\(180deg,\s*#41b0ff\s+20%,\s*#4652ef\s+100%\);/)
  })

  it('.splash uses var(--gradient-brand), position: fixed, and inset: 0', () => {
    const splashBlock = block(splashCss, '.splash')
    expect(splashBlock).toMatch(/position:\s*fixed/)
    expect(splashBlock).toMatch(/inset:\s*0/)
    expect(splashBlock).toMatch(/background:\s*var\(--gradient-brand\)/)
  })

  it('.mark and .name have white brightness/invert filter and dimensions', () => {
    const markBlock = block(splashCss, '.mark')
    const nameBlock = block(splashCss, '.name')

    expect(markBlock).toMatch(/width:\s*128px/)
    expect(markBlock).toMatch(/filter:\s*brightness\(0\)\s+invert\(1\)/)

    expect(nameBlock).toMatch(/width:\s*192px/)
    expect(nameBlock).toMatch(/filter:\s*brightness\(0\)\s+invert\(1\)/)
  })

  it('SplashGate.module.css contains no hardcoded hex colors', () => {
    expect(splashCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

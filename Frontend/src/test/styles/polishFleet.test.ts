import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8')

const rule = (source: string, selector: string) => {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return m ? m[1].replace(/\s+/g, ' ').trim() : undefined
}

const alertas = read('pages/AlertasPage.module.css')

describe('Alertas grid (POL-04)', () => {
  const grid = rule(alertas, '.grid') ?? ''

  it('fits columns of at least 240px and caps each card at 288px', () => {
    expect(grid).toContain('grid-template-columns: repeat(auto-fill, minmax(calc(240 * var(--px, 1px)), 1fr))')
    expect(grid).toContain('justify-content: start')
    const child = rule(alertas, '.grid > *') ?? ''
    expect(child).toContain('max-width: calc(288 * var(--px, 1px))')
    expect(child).toContain('width: 100%')
  })

  it('keeps the three smaller breakpoints on their column counts', () => {
    const css = alertas.replace(/\s+/g, ' ')
    expect(css).toMatch(/@media \(max-width: 1279px\) \{ \.grid \{ grid-template-columns: repeat\(3, 1fr\);/)
    expect(css).toMatch(/@media \(max-width: 899px\) \{ \.grid \{ grid-template-columns: repeat\(2, 1fr\);/)
    expect(css).toMatch(/@media \(max-width: 639px\) \{ \.grid \{ grid-template-columns: 1fr;/)
  })

  it.each(['1279px', '899px', '639px'])('lets cards fill the column at max-width %s', (bp) => {
    const css = alertas.replace(/\s+/g, ' ')
    expect(css).toMatch(new RegExp(`@media \\(max-width: ${bp}\\) \\{[^@]*\\.grid > \\* \\{ max-width: none;`))
  })
})

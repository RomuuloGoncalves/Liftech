import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './cards/shell'

const css = readFileSync(resolve(process.cwd(), 'src/pages/employee/EmployeeHomePage.module.css'), 'utf8')
const block = (source: string, selector: string) =>
  source.match(new RegExp(`(?:^|\\n)\\s*\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
const media = (min: number) =>
  css.match(new RegExp(`@media \\(min-width: ${min}px\\) \\{([\\s\\S]*?\\n)\\}`))?.[1] ?? ''

describe('EmployeeHomePage styles (CARD-09)', () => {
  it('.lastCard and .stat use the shared card shell', () => {
    expectSharedShell(css, '.lastCard', 'card')
    expectSharedShell(css, '.stat', 'card')
  })

  it('contains no font-size: 10px in the file', () => {
    expect(css).not.toMatch(/font-size:\s*10px/)
  })

  it('.statLabel uses --text-label', () => {
    expect(block(css, '.statLabel')).toContain('color: var(--text-label);')
  })

  it('stats grid keeps 2 columns and 8px gap', () => {
    const statsBlock = block(css, '.stats')
    expect(statsBlock).toContain('grid-template-columns: 1fr 1fr;')
    expect(statsBlock).toContain('gap: 8px;')
  })

  it('list is 1 column by default, 2 from 768px and 3 from 1200px', () => {
    expect(block(css, '.list')).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(block(media(768), '.list')).toContain('repeat(2, minmax(0, 1fr))')
    expect(block(media(1200), '.list')).toContain('repeat(3, minmax(0, 1fr))')
  })

  it('has no fixed width above 100%', () => {
    const widths = [...css.matchAll(/(?:^|[;{\s])(?:min-)?width:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(widths.filter((w) => /px|vw/.test(w))).toEqual([])
  })
})

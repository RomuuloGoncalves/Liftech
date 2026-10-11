import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/pages/employee/EmployeeHistoryPage.module.css'), 'utf8')
const block = (source: string, selector: string) =>
  source.match(new RegExp(`(?:^|\\n)\\s*\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
const media = (min: number) =>
  css.match(new RegExp(`@media \\(min-width: ${min}px\\) \\{([\\s\\S]*?\\n\\})\\n`))?.[1] ?? ''

describe('Employee history styles', () => {
  it('list has 1 column, 2 from 768px and 3 from 1200px', () => {
    expect(block(css, '.list')).toContain('grid-template-columns: minmax(0, 1fr)')
    expect(block(media(768), '.list')).toContain('repeat(2, minmax(0, 1fr))')
    expect(block(media(1200), '.list')).toContain('repeat(3, minmax(0, 1fr))')
  })

  it('has no fixed width wider than 100%', () => {
    const widths = [...css.matchAll(/(?:^|[\s;{])(?:min-)?width:\s*([^;]+);/g)].map((m) => m[1].trim())
    for (const width of widths) expect(width).toMatch(/^(100%|0)$/)
  })

  it('fields are 36px tall', () => {
    const body = block(css, '.field')
    expect(body).toContain('height: 36px;')
    expect(body).toContain('box-sizing: border-box;')
  })

  it('uses tokens for colors and font sizes', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/font-size:\s*\d+px/)
  })
})

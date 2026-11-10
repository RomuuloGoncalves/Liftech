import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/components/employee/IncidentSheet.module.css'), 'utf8')
const sheetCss = readFileSync(resolve(process.cwd(), 'src/components/employee/BottomSheet.module.css'), 'utf8')
const block = (source: string, selector: string) =>
  [...source.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('IncidentSheet styles', () => {
  it('inputs are 40px high, light gray with a line border, 8px radius and 14px text', () => {
    const input = block(css, '.input')
    expect(input).toMatch(/height:\s*40px/)
    expect(input).toMatch(/background:\s*var\(--gray-bg\)/)
    expect(input).toMatch(/border:\s*1px solid var\(--line\)/)
    expect(input).toMatch(/border-radius:\s*8px/)
    expect(input).toMatch(/font-size:\s*var\(--fs-base\)/)
  })

  it('icon uses the body text color', () => {
    const icon = block(css, '.icon')
    expect(icon).toMatch(/color:\s*var\(--text\)/)
  })

  it('labels are 12px with weight 600', () => {
    const label = block(css, '.label')
    expect(label).toMatch(/font-size:\s*var\(--fs-sm\)/)
    expect(label).toMatch(/font-weight:\s*600/)
  })

  it('time field is about 120px wide', () => {
    expect(block(css, '.timeField')).toMatch(/width:\s*120px/)
  })

  it('footer buttons are red cancel and blue submit with white text', () => {
    expect(block(css, '.cancel')).toMatch(/background:\s*var\(--danger-solid\)/)
    expect(block(css, '.cancel')).toMatch(/color:\s*var\(--white\)/)
    expect(block(css, '.submit')).toMatch(/background:\s*var\(--blue\)/)
    expect(block(css, '.submit')).toMatch(/color:\s*var\(--white\)/)
  })

  it('the sheet is centered with max 480px on wide screens', () => {
    expect(sheetCss).toMatch(/@media \(min-width: 768px\)\s*\{[\s\S]*max-width:\s*480px/)
  })

  it('uses no hex colors', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

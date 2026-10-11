import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), `src/components/employee/${file}`), 'utf8')
const block = (css: string, selector: string) =>
  css.match(new RegExp(`(?:^|\\n)\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
const hex = /#[0-9a-fA-F]{3,8}\b/

describe('Employee shell styles', () => {
  const bar = read('TabBar.module.css')

  it('TabBar is fixed, centered, white with border', () => {
    const b = block(bar, '.bar')
    expect(b).toContain('position: fixed')
    expect(b).toContain('left: 50%')
    expect(b).toContain('translateX(-50%)')
    expect(b).toContain('env(safe-area-inset-bottom)')
    expect(b).toContain('background: var(--bg)')
    expect(b).toContain('var(--gray-border)')
  })

  it('active tab is a blue circle with white icon', () => {
    const b = block(bar, '.active')
    expect(b).toContain('background: var(--blue)')
    expect(b).toContain('color: var(--white)')
  })

  it('layout uses page background, 100svh and 1120px column', () => {
    const css = read('EmployeeLayout.module.css')
    expect(block(css, '.layout')).toContain('background: var(--bg-page)')
    expect(block(css, '.layout')).toContain('min-height: 100svh')
    expect(block(css, '.column')).toContain('max-width: 1120px')
  })

  it('header buttons are 40px circles; menu is blue', () => {
    const css = read('EmployeeHeader.module.css')
    const b = block(css, '.alertButton,\n.menuButton')
    expect(b).toContain('width: 40px')
    expect(b).toContain('height: 40px')
    expect(b).toContain('border-radius: 50%')
    expect(css).toMatch(/\.menuButton \{[^}]*background: var\(--blue\)/)
  })

  it.each(['TabBar', 'EmployeeLayout', 'EmployeeHeader'])('%s css has no hex colors', (n) => {
    expect(read(`${n}.module.css`)).not.toMatch(hex)
  })
})

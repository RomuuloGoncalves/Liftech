import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8')
const block = (file: string, selector: string) => {
  const escaped = selector.replace(/[.]/g, '\\.')
  const m = read(file).match(new RegExp(`(?:^|\\n)${escaped}\\s*{([^}]*)}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

describe('page background with white surfaces (RST-04)', () => {
  it('paints .app-main with --bg-page', () => {
    expect(block('App.css', '.app-main')).toContain('background: var(--bg-page);')
  })

  it.each([
    ['pages/EquipePage.module.css', '.section', 'var(--bg)'],
    ['pages/AlertasPage.module.css', '.panel', 'var(--bg)'],
    ['components/fleet/FleetRow.module.css', '.row', 'var(--white)'],
  ])('keeps %s %s white (%s)', (file, selector, token) => {
    expect(block(file, selector)).toContain(`background: ${token};`)
  })
})

describe('primary buttons use --blue (RST-08)', () => {
  it.each([
    ['pages/VisaoGeralPage.module.css', '.registerButton'],
    ['pages/EquipePage.module.css', '.registerButton'],
    ['pages/FrotaPage.module.css', '.createButton'],
    ['pages/FrotaPage.module.css', '.addCategory'],
    ['components/fleet/FleetRow.module.css', '.addButton'],
    ['components/machines/NewMachinePanel.module.css', '.submitButton'],
  ])('fills %s %s with --blue and white text', (file, selector) => {
    const css = block(file, selector)
    expect(css).toContain('background: var(--blue);')
    expect(css).toContain('color: var(--white);')
  })
})

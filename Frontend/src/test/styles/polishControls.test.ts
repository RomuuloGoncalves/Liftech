import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8')

const declarations = (file: string, selector: string) => {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')
  const blocks = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  return blocks
    .filter(([, selectors]) => selectors.split(',').some((s) => s.trim() === selector))
    .map(([, , body]) => body.replace(/\s+/g, ' ').trim())
    .join(' ')
}

const controls: [string, string][] = [
  ['pages/VisaoGeralPage.module.css', '.registerButton'],
  ['pages/VisaoGeralPage.module.css', '.searchInput'],
  ['pages/VisaoGeralPage.module.css', '.statusSelect'],
  ['pages/FrotaPage.module.css', '.createButton'],
  ['pages/FrotaPage.module.css', '.search'],
  ['pages/FrotaPage.module.css', '.filter'],
  ['pages/EquipePage.module.css', '.registerButton'],
  ['pages/EquipePage.module.css', '.searchInput'],
  ['pages/EquipePage.module.css', '.select'],
  ['pages/AlertasPage.module.css', '.searchInput'],
  ['pages/AlertasPage.module.css', '.period'],
]

describe('toolbar controls are 32px tall with 13px text (POL-05)', () => {
  it.each(controls)('%s %s', (file, selector) => {
    const body = declarations(file, selector)
    expect(body).toContain('height: 32px;')
    expect(body).toContain('box-sizing: border-box;')
    if (selector !== '.search') expect(body).toContain('font-size: var(--fs-md);')
    expect(body).not.toMatch(/padding(?:-top|-bottom)?:\s*(?:[1-9]\d*px)\s/)
  })

  it.each([
    ['pages/VisaoGeralPage.module.css', '.registerButton'],
    ['pages/FrotaPage.module.css', '.createButton'],
    ['pages/EquipePage.module.css', '.registerButton'],
  ])('%s %s keeps weight 600', (file, selector) => {
    expect(declarations(file, selector)).toContain('font-weight: 600;')
  })

  it('Frota inner search input uses --fs-md', () => {
    expect(declarations('pages/FrotaPage.module.css', '.search input')).toContain('font-size: var(--fs-md);')
  })

  it('keeps the Frota add-category button at 32px', () => {
    const body = declarations('pages/FrotaPage.module.css', '.addCategory')
    expect(body).toContain('width: calc(32 * var(--px, 1px));')
    expect(body).toContain('height: calc(32 * var(--px, 1px));')
  })
})

describe('sidebar items (POL-06)', () => {
  const body = declarations('components/layout/Sidebar.module.css', '.navLink')

  it('uses --fs-md', () => {
    expect(body).toContain('font-size: var(--fs-md);')
  })

  it('keeps the 38px item height (10px padding, 12px side)', () => {
    expect(body).toContain('padding: 10px 12px;')
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const equipeCss = readFileSync(
  resolve(process.cwd(), 'src/pages/EquipePage.module.css'),
  'utf8',
)
const solicitacoesCss = readFileSync(
  resolve(process.cwd(), 'src/pages/SolicitacoesPage.module.css'),
  'utf8',
)

const clean = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const block = (css: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = clean(css).match(new RegExp(`(?:^|\\n|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

describe('Equipe grid (CARD-10)', () => {
  it('uses --card-grid-min and --card-grid-gap', () => {
    const b = block(equipeCss, '.grid')
    expect(b).toMatch(/grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(var\(--card-grid-min\),\s*1fr\)\);/)
    expect(b).toMatch(/gap:\s*var\(--card-grid-gap\);/)
  })
})

describe('Solicitações grid (CARD-10)', () => {
  it('uses minmax(280px, 1fr) and --card-grid-gap', () => {
    const b = block(solicitacoesCss, '.grid')
    expect(b).toMatch(/grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(280px,\s*1fr\)\);/)
    expect(b).toMatch(/gap:\s*var\(--card-grid-gap\);/)
  })

  it('keeps 1fr in max-width: 480px media query', () => {
    const compact = clean(solicitacoesCss).replace(/\s+/g, ' ')
    expect(compact).toMatch(/@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.grid\s*\{[^}]*grid-template-columns:\s*1fr;/)
  })
})

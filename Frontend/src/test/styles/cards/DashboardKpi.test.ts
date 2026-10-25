import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/pages/DashboardPage.module.css'),
  'utf8',
)

const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
const block = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = cleanCss.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ').trim()
}

describe('Dashboard KPI quickCard (CARD-09)', () => {
  it('composes cardLg shared shell without local padding, border or background overrides', () => {
    expectSharedShell(css, '.quickCard', 'cardLg')
  })

  it('keeps flex layout in row direction with centered alignment', () => {
    const b = block('.quickCard')
    expect(b).toMatch(/composes: (card|cardLg) row from/)
    expect(b).toContain('align-items: center;')
  })

  it('styles .cardNumber with --fs-2xl, 700 weight and --text-h color', () => {
    const b = block('.cardNumber')
    expect(b).toContain('font-size: var(--fs-2xl);')
    expect(b).toContain('font-weight: 700;')
    expect(b).toContain('color: var(--text-h);')
  })

  it('styles .cardLabel with --text-label color', () => {
    const b = block('.cardLabel')
    expect(b).toContain('color: var(--text-label);')
  })

  it('does not cite --black-title or --black-text in any quickCard or card element rules', () => {
    const cardSelectors = ['.quickCard', '.cardNumber', '.cardLabel', '.cardContent', '.cardError']
    for (const selector of cardSelectors) {
      const b = block(selector)
      expect(b).not.toContain('--black-title')
      expect(b).not.toContain('--black-text')
    }

    const quickCardMatches = cleanCss.matchAll(/(?:^|\})\s*(\.quickCard[^{]*)\{([^}]*)\}/g)
    for (const match of quickCardMatches) {
      expect(match[2]).not.toContain('--black-title')
      expect(match[2]).not.toContain('--black-text')
    }
  })
})

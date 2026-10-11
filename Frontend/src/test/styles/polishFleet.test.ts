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

const card = read('components/fleet/FleetCard.module.css')
const alertas = read('pages/AlertasPage.module.css')

describe('FleetCard compact pattern (POL-01)', () => {
  const body = rule(card, '.card') ?? ''

  it('uses padding 12, radius 8 and gap 8', () => {
    expect(body).toContain('padding: calc(12 * var(--px, 1px))')
    expect(body).toContain('border-radius: calc(8 * var(--px, 1px))')
    expect(body).toContain('gap: calc(8 * var(--px, 1px))')
  })

  it('writes the title as 13px/600 on one line with ellipsis', () => {
    const nome = rule(card, '.nome') ?? ''
    expect(nome).toContain('font-size: calc(13 * var(--px, 1px))')
    expect(nome).toContain('font-weight: 600')
    expect(nome).toContain('white-space: nowrap')
    expect(nome).toContain('text-overflow: ellipsis')
    expect(nome).toContain('overflow: hidden')
  })

  it('uses 11px for the code', () => {
    expect(rule(card, '.code')).toContain('font-size: calc(11 * var(--px, 1px))')
  })
})

describe('FleetCard coloured strip (POL-03)', () => {
  const groups = {
    urgency: '.topRow.danger, .topRow.warning, .topRow.caution',
    status: '.topRow.statusAvailable, .topRow.statusInUse, .topRow.statusMaintenance, .topRow.statusOffline',
  }

  it.each(Object.entries(groups))('%s strip has padding 8px 12px and keeps the -12 bleed', (_name, selector) => {
    const body = rule(card, selector) ?? ''
    expect(body).toContain('padding: calc(8 * var(--px, 1px)) calc(12 * var(--px, 1px))')
    expect(body).toContain('margin: calc(-12 * var(--px, 1px)) calc(-12 * var(--px, 1px)) 0')
  })

  it.each(Object.entries(groups))('%s strip rounds the top corners at 7px (card radius minus 1)', (_name, selector) => {
    expect(rule(card, selector)).toContain('border-radius: calc(7 * var(--px, 1px)) calc(7 * var(--px, 1px)) 0 0')
  })
})

describe('FleetCard Figma layout (POL-02)', () => {
  const body = rule(card, '.body') ?? ''
  const lists = rule(card, '.details, .highlight') ?? ''

  it('places the pairs column and the highlight side by side, bottom aligned', () => {
    expect(body).toContain('display: flex')
    expect(body).toContain('align-items: flex-end')
    expect(body).toContain('justify-content: space-between')
    expect(body).toContain('gap: calc(8 * var(--px, 1px))')
    expect(rule(card, '.details')).toContain('min-width: 0')
  })

  it('stacks the left pairs in a single column', () => {
    expect(lists).toContain('display: flex')
    expect(lists).toContain('flex-direction: column')
  })

  it('has no forced min-height on the card', () => {
    expect(rule(card, '.card')).not.toContain('min-height')
  })

  it('puts the 11px label above the 13px value, both in --text', () => {
    const dt = rule(card, '.details dt, .highlight dt') ?? ''
    const dd = rule(card, '.details dd, .highlight dd') ?? ''
    expect(dt).toContain('font-size: var(--fs-xs)')
    expect(dt).toContain('color: var(--text)')
    expect(dd).toContain('font-size: var(--fs-md)')
    expect(dd).toContain('color: var(--text)')
    expect(card).not.toMatch(/dt::after/)
    expect(rule(card, '.details > div')).not.toContain('display: flex')
  })

  it('truncates the left values to one line with an ellipsis', () => {
    const dd = rule(card, '.details dd') ?? ''
    expect(dd).toContain('overflow: hidden')
    expect(dd).toContain('text-overflow: ellipsis')
    expect(dd).toContain('white-space: nowrap')
  })

  it('aligns the highlight to the right with an 18px/700 value', () => {
    expect(rule(card, '.highlight')).toContain('text-align: right')
    const value = rule(card, '.highlight dd') ?? ''
    expect(value).toContain('font-size: var(--fs-xl)')
    expect(value).toContain('font-weight: 700')
  })

  it('colours the urgency by tone and the session time in --black-text at 600', () => {
    expect(rule(card, '.highlight .danger')).toContain('color: var(--urgency-critical)')
    expect(rule(card, '.highlight .warning')).toContain('color: var(--urgency-high)')
    expect(rule(card, '.highlight .caution')).toContain('color: var(--urgency-medium)')
    const session = rule(card, '.highlight .session') ?? ''
    expect(session).toContain('color: var(--black-text)')
    expect(session).toContain('font-weight: 600')
  })
})

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

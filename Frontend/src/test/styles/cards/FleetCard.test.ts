import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const card = readFileSync(
  resolve(process.cwd(), 'src/components/fleet/FleetCard.module.css'),
  'utf8',
)

const rule = (source: string, selector: string) => {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return m ? m[1].replace(/\s+/g, ' ').trim() : undefined
}

describe('FleetCard compact pattern (POL-01, CARD-03, CARD-05)', () => {
  it('uses shared shell (.card)', () => {
    expectSharedShell(card, '.card', 'card')
  })

  it('maintains kanban fixed column flex', () => {
    expect(rule(card, '.card')).toContain('flex: 0 0 calc(288 * var(--px, 1px))')
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
  const groups = { header: '.topRow' }

  it.each(Object.entries(groups))('%s strip has padding 8px 12px and keeps the -12 bleed', (_name, selector) => {
    const body = rule(card, selector) ?? ''
    expect(body).toContain('padding: calc(8 * var(--px, 1px)) calc(12 * var(--px, 1px))')
    expect(body).toContain('margin: calc(-12 * var(--px, 1px)) calc(-12 * var(--px, 1px)) 0')
  })

  it.each(Object.entries(groups))('%s strip rounds the top corners at 7px (card radius minus 1)', (_name, selector) => {
    expect(rule(card, selector)).toContain('border-radius: calc(7 * var(--px, 1px)) calc(7 * var(--px, 1px)) 0 0')
  })
})

describe('FleetCard Figma layout (POL-02, CARD-05)', () => {
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

  it('does not style dt or dd in the module', () => {
    expect(card).not.toMatch(/(?:^|\})\s*(?:[^{}]*,\s*)*dt\b/)
    expect(card).not.toMatch(/(?:^|\})\s*(?:[^{}]*,\s*)*dd\b/)
  })

  it('aligns the highlight to the right', () => {
    expect(rule(card, '.highlight')).toContain('text-align: right')
  })

  it('colours the urgency by tone and the session time in --black-text at 600', () => {
    expect(rule(card, '.danger')).toContain('color: var(--urgency-critical)')
    expect(rule(card, '.warning')).toContain('color: var(--urgency-high)')
    expect(rule(card, '.caution')).toContain('color: var(--urgency-medium)')
    const session = rule(card, '.session') ?? ''
    expect(session).toContain('color: var(--black-text)')
    expect(session).toContain('font-weight: 600')
  })
})

describe('FleetCard accident urgency (RST-10, RST-11, CARD-05)', () => {
  it.each([
    ['danger', 'urgency-critical'],
    ['warning', 'urgency-high'],
    ['caution', 'urgency-medium'],
  ])('.%s fills the header with --%s and colours the label with it', (tone, token) => {
    const header = rule(card, `.topRow.${tone}`)
    expect(header).toContain(`background: var(--${token})`)
    expect(rule(card, `.${tone}`)).toContain(`color: var(--${token})`)
  })

  it('paints the filled header text white', () => {
    expect(rule(card, '.topRow.danger, .topRow.warning, .topRow.caution')).toContain('color: var(--white)')
    expect(rule(card, '.topRow :is(.nome, .code, .menuButton)')).toContain('color: inherit')
  })

  it('has no icon box rule', () => {
    expect(card).not.toMatch(/\.icon\s*\{/)
  })

  it('uses --blue for info and --green for success labels', () => {
    expect(rule(card, '.info')).toContain('color: var(--blue)')
    expect(rule(card, '.success')).toContain('color: var(--green)')
  })

  it('falls back to --blue for the arrival highlight', () => {
    expect(card).toContain('var(--category-color, var(--blue))')
  })
})

describe('FleetCard status header (RST-12, FRT-09)', () => {
  it('lets the header text inherit the status tone colour', () => {
    expect(rule(card, '.topRow :is(.nome, .code, .menuButton)')).toContain('color: inherit')
  })

  it('shapes every header to bleed to the card edge', () => {
    const shape = rule(card, '.topRow')
    expect(shape).toContain('margin: calc(-12 * var(--px, 1px)) calc(-12 * var(--px, 1px)) 0')
    expect(shape).toContain('padding: calc(8 * var(--px, 1px)) calc(12 * var(--px, 1px))')
  })
})

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const hexes = (css: string) => strip(css).match(/#[0-9a-f]{3,8}\b/gi) ?? []
const colouredRgba = (css: string) =>
  (strip(css).match(/rgba?\([^)]*\)/gi) ?? []).filter(
    (c) => !/^rgba?\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]/i.test(c),
  )

describe('FleetCard CSS has no loose colours', () => {
  it('has no #hex nor coloured rgba', () => {
    expect(hexes(card)).toEqual([])
    expect(colouredRgba(card)).toEqual([])
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/components/fleet/${file}`), 'utf8')
const norm = (v: string) => v.replace(/\s+/g, ' ').trim()

const rule = (source: string, selector: string) => {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return m ? norm(m[1]) : undefined
}

describe('FleetRow category chips (RST-07)', () => {
  const css = read('FleetRow.module.css')

  it.each([
    ['acidentes', 'red'],
    ['ativas', 'blue'],
    ['manutencao', 'yellow'],
    ['disponiveis', 'green'],
  ])('chip of kind %s uses --%s-bg with the solid --%s text and border', (kind, color) => {
    const body = rule(css, `.${kind}`)
    expect(body).toBeDefined()
    expect(body).toContain(`--chip-bg: var(--${color}-bg)`)
    expect(body).toContain(`--chip: var(--${color})`)
    expect(body).toContain(`--chip-text: var(--${color})`)
  })

  it('custom chips keep deriving the colour from --category-color', () => {
    expect(rule(css, '.label')).toContain('--chip: var(--category-color)')
    expect(rule(css, '.label')).toContain('color-mix(in srgb, var(--category-color) 25%')
  })

  it('draws the chip border with the chip colour', () => {
    expect(rule(css, '.label')).toContain('border: 1px solid var(--chip)')
  })
})

describe('FleetRow danger button (RST-08)', () => {
  it('fills "Excluir categoria" with --danger-solid and white text', () => {
    const body = rule(read('FleetRow.module.css'), '.deleteButton')
    expect(body).toContain('background: var(--danger-solid)')
    expect(body).toContain('color: var(--white)')
  })
})

describe('FleetCard accident urgency (RST-10, RST-11)', () => {
  const css = read('FleetCard.module.css')

  it.each([
    ['danger', 'urgency-critical'],
    ['warning', 'urgency-high'],
    ['caution', 'urgency-medium'],
  ])('.%s fills the header with --%s and colours the label with it', (tone, token) => {
    const header = rule(css, `.topRow.${tone}`)
    expect(header).toContain(`background: var(--${token})`)
    expect(rule(css, `.highlight .${tone}`)).toContain(`color: var(--${token})`)
  })

  it('paints the filled header text white', () => {
    expect(rule(css, '.topRow.danger, .topRow.warning, .topRow.caution')).toContain('color: var(--white)')
    expect(rule(css, '.topRow :is(.nome, .code, .menuButton)')).toContain('color: inherit')
  })

  it('has no icon box rule', () => {
    expect(css).not.toMatch(/\.icon\s*\{/)
  })

  it('uses --blue for info and --green for success labels', () => {
    expect(rule(css, '.highlight .info')).toContain('color: var(--blue)')
    expect(rule(css, '.highlight .success')).toContain('color: var(--green)')
  })

  it('falls back to --blue for the arrival highlight', () => {
    expect(css).toContain('var(--category-color, var(--blue))')
  })
})

describe('FleetCard status header (RST-12, FRT-09)', () => {
  const css = read('FleetCard.module.css')
  const badge = read('../machines/StatusBadge.module.css')

  it.each([
    ['toneDisponivel', '--green', '--white'],
    ['toneEmUso', '--blue', '--white'],
    ['toneManutencao', '--yellow', '--black-title'],
    ['toneAlerta', '--danger-solid', '--white'],
    ['toneOffline', '--black-text', '--white'],
  ])('STATUS_TONE .%s fills the header with var(%s) and writes in var(%s)', (cls, bg, fg) => {
    expect(rule(badge, `.${cls}`)).toContain(`background: var(${bg})`)
    expect(rule(badge, `.${cls}`)).toContain(`color: var(${fg})`)
  })

  it('lets the header text inherit the status tone colour', () => {
    expect(rule(css, '.topRow :is(.nome, .code, .menuButton)')).toContain('color: inherit')
  })

  it('shapes every header to bleed to the card edge', () => {
    const shape = rule(css, '.topRow')
    expect(shape).toContain('margin: calc(-12 * var(--px, 1px)) calc(-12 * var(--px, 1px)) 0')
    expect(shape).toContain('padding: calc(8 * var(--px, 1px)) calc(12 * var(--px, 1px))')
  })
})

const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const hexes = (css: string) => strip(css).match(/#[0-9a-f]{3,8}\b/gi) ?? []
const colouredRgba = (css: string) =>
  (strip(css).match(/rgba?\([^)]*\)/gi) ?? []).filter((c) => !/^rgba?\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]/i.test(c))

describe('fleet CSS has no loose colours', () => {
  it.each([
    'FleetRow.module.css',
    'FleetCard.module.css',
    'CategoryFormModal.module.css',
    'MachinePickerModal.module.css',
  ])('%s has no #hex nor coloured rgba', (file) => {
    const css = read(file)
    expect(hexes(css)).toEqual([])
    expect(colouredRgba(css)).toEqual([])
  })
})

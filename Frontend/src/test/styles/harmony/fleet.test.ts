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

describe('FleetCard (T26)', () => {
  const file = 'components/fleet/FleetCard.module.css'

  it('caution header uses --text-h instead of --white', () => {
    expect(declarations(file, '.topRow.caution')).toContain('color: var(--text-h);')
  })

  it('nome drops letter-spacing: 0', () => {
    expect(declarations(file, '.nome')).not.toContain('letter-spacing')
  })

  it('drops --black-text in favour of --text', () => {
    expect(read(file)).not.toContain('var(--black-text)')
    expect(read(file)).not.toContain('var(--black-title)')
  })
})

describe('FleetRow (T27)', () => {
  const file = 'components/fleet/FleetRow.module.css'

  it('manutencao chip uses --yellow-text', () => {
    expect(declarations(file, '.manutencao')).toContain('--chip-text: var(--yellow-text);')
    expect(declarations(file, '.manutencao')).toContain('color: var(--yellow-text);')
  })

  it('label adds font-weight: 500', () => {
    expect(declarations(file, '.label')).toContain('font-weight: 500;')
  })

  it('count has font-variant-numeric: tabular-nums', () => {
    expect(declarations(file, '.count')).toContain('font-variant-numeric: tabular-nums;')
  })

  it('drops local ::placeholder rule', () => {
    expect(read(file)).not.toContain('::placeholder')
  })

  it('editButton and deleteButton use font-weight: 600 instead of 700', () => {
    expect(declarations(file, '.editButton')).toContain('font-weight: 600;')
    expect(declarations(file, '.deleteButton')).toContain('font-weight: 600;')
    expect(declarations(file, '.editButton')).not.toContain('font-weight: 700;')
  })

  it('transitions use --dur-fast and --ease-out tokens', () => {
    expect(declarations(file, '.row')).toContain('var(--dur-fast) var(--ease-out)')
    expect(declarations(file, '.addButton')).toContain('var(--dur-fast) var(--ease-out)')
    expect(read(file)).not.toMatch(/120ms\s+ease\b/)
  })

  it('drops --black-text in favour of --text', () => {
    expect(read(file)).not.toContain('var(--black-text)')
    expect(read(file)).not.toContain('var(--black-title)')
  })
})

describe('CategoryFormModal (T28)', () => {
  const file = 'components/fleet/CategoryFormModal.module.css'

  it('nameInput uses --fs-md', () => {
    expect(declarations(file, '.nameInput')).toContain('font-size: var(--fs-md);')
  })

  it('hex input uses --fs-sm and tabular-nums', () => {
    expect(declarations(file, '.hex input')).toContain('font-size: var(--fs-sm);')
    expect(declarations(file, '.hex input')).toContain('font-variant-numeric: tabular-nums;')
  })

  it('drops local ::placeholder rule', () => {
    expect(read(file)).not.toContain('::placeholder')
  })

  it('error uses --danger-text', () => {
    expect(declarations(file, '.error')).toContain('color: var(--danger-text);')
  })

  it('popover translates vertically only and animates with --dur-base', () => {
    const pop = declarations(file, '.popover')
    expect(pop).toContain('translate: -40% 0;')
    expect(pop).not.toContain('translateX(-40%)')
    expect(pop).toContain('animation: menu-in var(--dur-base) var(--ease-out);')
  })

  it('drops --black-text in favour of --text', () => {
    expect(read(file)).not.toContain('var(--black-text)')
    expect(read(file)).not.toContain('var(--black-title)')
  })
})

describe('MachinePickerModal (T29)', () => {
  const file = 'components/fleet/MachinePickerModal.module.css'

  it('search input uses --fs-md', () => {
    expect(declarations(file, '.search input')).toContain('font-size: var(--fs-md);')
  })

  it('option uses --fs-md', () => {
    expect(declarations(file, '.option')).toContain('font-size: var(--fs-md);')
  })

  it('empty retains --fs-sm inside container', () => {
    expect(declarations(file, '.empty')).toContain('font-size: var(--fs-sm);')
  })

  it('drops --black-text in favour of --text', () => {
    expect(read(file)).not.toContain('var(--black-text)')
    expect(read(file)).not.toContain('var(--black-title)')
  })
})

describe('StatusBadge (T30)', () => {
  const file = 'components/machines/StatusBadge.module.css'

  it('em_uso uses --blue-text', () => {
    expect(declarations(file, '.em_uso')).toContain('color: var(--blue-text);')
  })

  it('manutencao uses --yellow-text', () => {
    expect(declarations(file, '.manutencao')).toContain('color: var(--yellow-text);')
  })
})

describe('MachineDetailModal (T31)', () => {
  const file = 'components/machines/MachineDetailModal.module.css'

  it('infoValue uses --fs-sm, weight 600 and tabular-nums', () => {
    const val = declarations(file, '.infoValue')
    expect(val).toContain('font-size: var(--fs-sm);')
    expect(val).toContain('font-weight: 600;')
    expect(val).toContain('font-variant-numeric: tabular-nums;')
  })

  it('action button uses --fs-sm and weight 600', () => {
    const act = declarations(file, '.action')
    expect(act).toContain('font-size: var(--fs-sm);')
    expect(act).toContain('font-weight: 600;')
  })

  it('tab uses --fs-sm and weight 600', () => {
    const tab = declarations(file, '.tab')
    expect(tab).toContain('font-size: var(--fs-sm);')
    expect(tab).toContain('font-weight: 600;')
  })

  it('retry button uses --fs-sm and tokens for transition', () => {
    const btn = declarations(file, '.historyRetryButton')
    expect(btn).toContain('font-size: var(--fs-sm);')
    expect(btn).toContain('var(--dur-fast) var(--ease-out)')
  })

  it('historyErrorMessage uses --danger-text', () => {
    expect(declarations(file, '.historyErrorMessage')).toContain('color: var(--danger-text);')
  })

  it('empty uses --fs-sm', () => {
    expect(declarations(file, '.empty')).toContain('font-size: var(--fs-sm);')
  })

  it('event uses tabular-nums', () => {
    expect(declarations(file, '.event')).toContain('font-variant-numeric: tabular-nums;')
  })

  it('has no font-weight: 700 nor bold', () => {
    const css = read(file)
    expect(css).not.toMatch(/font-weight:\s*700\b/)
    expect(css).not.toMatch(/font-weight:\s*bold\b/)
  })
})

describe('AlertasPage (T32)', () => {
  const file = 'pages/AlertasPage.module.css'

  it('panel uses 24px padding and --radius-lg', () => {
    const panel = declarations(file, '.panel')
    expect(panel).toContain('padding: 24px;')
    expect(panel).toContain('border-radius: var(--radius-lg);')
  })

  it('count has font-variant-numeric: tabular-nums', () => {
    expect(declarations(file, '.count')).toContain('font-variant-numeric: tabular-nums;')
  })

  it('drops local ::placeholder rule', () => {
    expect(read(file)).not.toContain('::placeholder')
  })

  it('drops --black-text in favour of --text', () => {
    expect(read(file)).not.toContain('var(--black-text)')
    expect(read(file)).not.toContain('var(--black-title)')
  })
})




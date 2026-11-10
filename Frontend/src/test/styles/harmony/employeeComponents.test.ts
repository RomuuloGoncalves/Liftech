import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')
const clean = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const block = (css: string, selector: string) => {
  const found = [...clean(css).matchAll(/([^{}]+)\{([^}]*)\}/g)].find(([, s]) => s.replace(/\s+/g, ' ').trim() === selector)
  return found ? found[2].replace(/\s+/g, ' ').trim() : ''
}

describe('IncidentSheet.module.css harmony components (T45)', () => {
  const incidentCss = read('src/components/employee/IncidentSheet.module.css')

  it('label uses --fs-sm and weight 600', () => {
    const lbl = block(incidentCss, '.label')
    expect(lbl).toContain('font-size: var(--fs-sm);')
    expect(lbl).toContain('font-weight: 600;')
    expect(lbl).not.toContain('var(--fs-md)')
  })

  it('input uses --fs-base and placeholder is removed', () => {
    const inp = block(incidentCss, '.input')
    expect(inp).toContain('font-size: var(--fs-base);')
    expect(inp).not.toContain('var(--fs-sm)')
    expect(incidentCss).not.toContain('::placeholder')
  })

  it('buttons use font-weight: 600', () => {
    expect(block(incidentCss, '.button')).toContain('font-weight: 600;')
    expect(block(incidentCss, '.cancel')).toContain('font-weight: 600;')
  })

  it('error uses --fs-sm, weight 500 and --danger-text', () => {
    const err = block(incidentCss, '.error')
    expect(err).toContain('font-size: var(--fs-sm);')
    expect(err).toContain('font-weight: 500;')
    expect(err).toContain('color: var(--danger-text);')
    expect(err).not.toContain('var(--danger-solid)')
    expect(err).not.toContain('var(--fs-xs)')
  })

  it('icon uses var(--text)', () => {
    expect(block(incidentCss, '.icon')).toContain('color: var(--text);')
    expect(incidentCss).not.toContain('var(--black-text)')
  })

  it('drops duplicate .button:focus-visible with text-h outline', () => {
    expect(incidentCss).not.toContain('outline: 2px solid var(--text-h)')
  })
})

describe('MachineDetailSheet.module.css harmony components (T46)', () => {
  const sheetCss = read('src/components/employee/MachineDetailSheet.module.css')

  it('dateInput uses --fs-base and tabular-nums', () => {
    const di = block(sheetCss, '.dateInput')
    expect(di).toContain('font-size: var(--fs-base);')
    expect(di).toContain('font-variant-numeric: tabular-nums;')
    expect(di).not.toContain('var(--fs-xs)')
  })

  it('infoValue and itemMeta declare tabular-nums', () => {
    expect(block(sheetCss, '.infoValue')).toContain('font-variant-numeric: tabular-nums;')
    expect(block(sheetCss, '.itemMeta')).toContain('font-variant-numeric: tabular-nums;')
  })

  it('chip uses --fs-xs for badge role', () => {
    const chip = block(sheetCss, '.chip')
    expect(chip).toContain('font-size: var(--fs-xs);')
    expect(chip).not.toContain('var(--fs-sm)')
  })

  it('footerButton and cancel have font-weight: 600', () => {
    expect(block(sheetCss, '.footerButton')).toContain('font-weight: 600;')
    expect(block(sheetCss, '.cancel')).toContain('font-weight: 600;')
  })

  it('retryButton uses --fs-sm', () => {
    const rb = block(sheetCss, '.retryButton')
    expect(rb).toContain('font-size: var(--fs-sm);')
    expect(rb).not.toContain('var(--fs-xs)')
  })

  it('errorText uses --danger-text and weight 500', () => {
    const err = block(sheetCss, '.errorText')
    expect(err).toContain('color: var(--danger-text);')
    expect(err).toContain('font-weight: 500;')
    expect(err).not.toContain('var(--danger-solid)')
  })

  it('skeletonLine animates pulse for 1.2s instead of 1.5s', () => {
    const sk = block(sheetCss, '.skeletonLine')
    expect(sk).toContain('animation: pulse 1.2s ease-in-out infinite;')
    expect(sheetCss).not.toContain('1.5s')
  })
})

describe('MachineListCard.module.css harmony components (T47)', () => {
  const cardCss = read('src/components/employee/MachineListCard.module.css')

  it('action button has font-weight: 600', () => {
    const act = block(cardCss, '.action')
    expect(act).toContain('font-weight: 600;')
  })

  it('dateTime declares tabular-nums', () => {
    const dt = block(cardCss, '.dateTime')
    expect(dt).toContain('font-variant-numeric: tabular-nums;')
  })
})



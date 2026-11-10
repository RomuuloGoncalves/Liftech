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

describe('EmployeeSettingsPage (T40)', () => {
  const file = 'pages/employee/EmployeeSettingsPage.module.css'

  it('title uses weight 500', () => {
    expect(declarations(file, '.title')).toContain('font-weight: 500;')
  })

  it('sectionTitle uses --fs-base and weight 600', () => {
    const st = declarations(file, '.sectionTitle')
    expect(st).toContain('font-size: var(--fs-base);')
    expect(st).toContain('font-weight: 600;')
  })

  it('label uses weight 600', () => {
    expect(declarations(file, '.label')).toContain('font-weight: 600;')
  })

  it('input and textarea use --fs-base', () => {
    const input = declarations(file, '.input')
    const textarea = declarations(file, '.textarea')
    expect(input).toContain('font-size: var(--fs-base);')
    expect(textarea).toContain('font-size: var(--fs-base);')
  })

  it('drops textarea placeholder rule', () => {
    expect(read(file)).not.toContain('.textarea::placeholder')
  })

  it('noticeText uses --fs-xs', () => {
    expect(declarations(file, '.noticeText')).toContain('font-size: var(--fs-xs);')
  })

  it('logout and privacy buttons use --dur-fast and --ease-out tokens', () => {
    expect(declarations(file, '.logout')).toContain('opacity var(--dur-fast) var(--ease-out)')
    expect(declarations(file, '.privacy')).toContain('opacity var(--dur-fast) var(--ease-out)')
  })
})

describe('EmployeeSessionPage (T41)', () => {
  const file = 'pages/employee/EmployeeSessionPage.module.css'

  it('description uses semantic color --text', () => {
    expect(declarations(file, '.description')).toContain('color: var(--text);')
  })

  it('timer uses --text-h, retaining 48px, weight 700 and tabular-nums', () => {
    const timer = declarations(file, '.timer')
    expect(timer).toContain('color: var(--text-h);')
    expect(timer).toContain('font-size: 48px;')
    expect(timer).toContain('font-weight: 700;')
    expect(timer).toContain('font-variant-numeric: tabular-nums;')
  })

  it('button uses button-touch role with --fs-base and weight 600', () => {
    const btn = declarations(file, '.button')
    expect(btn).toContain('font-size: var(--fs-base);')
    expect(btn).toContain('font-weight: 600;')
  })
})

describe('EmployeeHomePage (T43)', () => {
  const file = 'pages/employee/EmployeeHomePage.module.css'

  it('lastName uses --fs-md and line-height: 1.35', () => {
    const name = declarations(file, '.lastName')
    expect(name).toContain('font-size: var(--fs-md);')
    expect(name).toContain('line-height: 1.35;')
  })

  it('digitBox, lastTime, lastDuration and statValue use tabular-nums', () => {
    expect(declarations(file, '.digitBox')).toContain('font-variant-numeric: tabular-nums;')
    expect(declarations(file, '.lastTime')).toContain('font-variant-numeric: tabular-nums;')
    expect(declarations(file, '.lastDuration')).toContain('font-variant-numeric: tabular-nums;')
    expect(declarations(file, '.statValue')).toContain('font-variant-numeric: tabular-nums;')
  })

  it('digitColon drops 700 for weight 600', () => {
    const colon = declarations(file, '.digitColon')
    expect(colon).toContain('font-weight: 600;')
    expect(colon).not.toContain('font-weight: 700;')
  })

  it('statLabel adds line-height: 1.35', () => {
    expect(declarations(file, '.statLabel')).toContain('line-height: 1.35;')
  })
})

describe('EmployeeHistoryPage (T44)', () => {
  const file = 'pages/employee/EmployeeHistoryPage.module.css'

  it('filtersTitle uses --fs-base', () => {
    expect(declarations(file, '.filtersTitle')).toContain('font-size: var(--fs-base);')
  })

  it('dateInput and input use --fs-base and dateInput uses tabular-nums', () => {
    const dateInput = declarations(file, '.dateInput')
    const input = declarations(file, '.input')
    expect(dateInput).toContain('font-size: var(--fs-base);')
    expect(dateInput).toContain('font-variant-numeric: tabular-nums;')
    expect(input).toContain('font-size: var(--fs-base);')
  })

  it('empty uses --fs-base', () => {
    expect(declarations(file, '.empty')).toContain('font-size: var(--fs-base);')
  })
})




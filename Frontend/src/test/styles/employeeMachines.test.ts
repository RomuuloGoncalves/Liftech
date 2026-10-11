import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src', file), 'utf8')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''
const media = (css: string, query: string) => css.match(new RegExp(`@media \\(${query}\\)\\s*\\{([\\s\\S]*?\\n\\})`))?.[1] ?? ''

const page = read('pages/employee/EmployeeMachinesPage.module.css')
const sheet = read('components/employee/MachineDetailSheet.module.css')

describe('EmployeeMachinesPage styles', () => {
  it('uses one column by default', () => {
    expect(block(page, '.list')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  })

  it('uses 2 columns from 768px', () => {
    expect(block(media(page, 'min-width: 768px'), '.list')).toMatch(/repeat\(2,/)
  })

  it('uses 3 columns from 1200px', () => {
    expect(block(media(page, 'min-width: 1200px'), '.list')).toMatch(/repeat\(3,/)
  })

  it('styles the search field with a line border, 36px height and 8px radius', () => {
    const search = block(page, '.search')
    expect(search).toMatch(/height:\s*36px/)
    expect(search).toMatch(/border:\s*1px solid var\(--line\)/)
    expect(search).toMatch(/border-radius:\s*8px/)
  })

  it('has no width larger than 100% or fixed pixel widths', () => {
    expect(page).not.toMatch(/(^|[^-])width:\s*(\d{3,}px|(10[1-9]|1[1-9]\d|[2-9]\d\d)%)/m)
  })
})

describe('MachineDetailSheet styles', () => {
  it('paints Cancelar with the danger token and Ativar with the blue token', () => {
    expect(block(sheet, '.cancel')).toMatch(/background:\s*var\(--danger-solid\)/)
    expect(block(sheet, '.activate')).toMatch(/background:\s*var\(--blue\)/)
    expect(block(sheet, '.footerButton')).toMatch(/flex:\s*1/)
  })

  it('draws the info box with gray background, line border and 8px radius', () => {
    const info = block(sheet, '.info')
    expect(info).toMatch(/background:\s*var\(--gray-bg\)/)
    expect(info).toMatch(/border:\s*1px solid var\(--line\)/)
    expect(info).toMatch(/border-radius:\s*8px/)
  })

  it('scrolls the timeline with a thin blue scrollbar', () => {
    const timeline = block(sheet, '.timeline')
    expect(timeline).toMatch(/overflow-y:\s*auto/)
    expect(timeline).toMatch(/scrollbar-width:\s*thin/)
    expect(timeline).toMatch(/scrollbar-color:\s*var\(--blue\)/)
  })

  it('has no fixed widths and no hex colors', () => {
    expect(sheet).not.toMatch(/(^|[^-])width:\s*(\d{3,}px|(10[1-9]|1[1-9]\d|[2-9]\d\d)%)/m)
    expect(sheet).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

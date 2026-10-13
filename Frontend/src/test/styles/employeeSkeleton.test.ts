import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src', file), 'utf8')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''
const media = (css: string, query: string) => css.match(new RegExp(`@media \\(${query}\\)\\s*\\{([\\s\\S]*?\\n\\})`))?.[1] ?? ''

const skeleton = read('components/employee/EmployeeSkeleton.module.css')
const listCard = read('components/employee/MachineListCard.module.css')
const home = read('pages/employee/EmployeeHomePage.module.css')
const history = read('pages/employee/EmployeeHistoryPage.module.css')
const num = (css: string, prop: string) => Number(css.match(new RegExp(`(?:^|[\\s;])${prop}:\\s*(-?[\\d.]+)px`))?.[1])
const pages = ['Machines', 'History', 'Home'].map((n) => read(`pages/employee/Employee${n}Page.module.css`))

describe('EmployeeSkeleton styles', () => {
  it('uses one column by default, 2 from 768px and 3 from 1200px, like the pages', () => {
    expect(block(skeleton, '.list')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/)
    expect(block(media(skeleton, 'min-width: 768px'), '.list')).toMatch(/repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
    expect(block(media(skeleton, 'min-width: 1200px'), '.list')).toMatch(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
    for (const page of pages) {
      expect(block(page, '.list')).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/)
      expect(block(media(page, 'min-width: 768px'), '.list')).toMatch(/repeat\(2,\s*minmax\(0,\s*1fr\)\)/)
      expect(block(media(page, 'min-width: 1200px'), '.list')).toMatch(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/)
    }
  })

  it('mirrors the card: 8px radius, line border, white background, 8px gap', () => {
    const card = block(skeleton, '.card')
    expect(card).toMatch(/border-radius:\s*8px/)
    expect(card).toMatch(/border:\s*1px solid var\(--line\)/)
    expect(card).toMatch(/background:\s*var\(--white\)/)
    expect(card).toMatch(/gap:\s*8px/)
  })

  it('sizes inputs and buttons at 40px', () => {
    expect(block(skeleton, '.input')).toMatch(/height:\s*40px/)
    expect(block(skeleton, '.button')).toMatch(/height:\s*40px/)
  })

  it('has no width larger than 100% (the illustration and timer shrink with max-width)', () => {
    expect(skeleton).not.toMatch(/(^|[^-])width:\s*(\d{4,}px|(10[1-9]|1[1-9]\d|[2-9]\d\d)%)/m)
    expect(block(skeleton, '.illustration')).toMatch(/width:\s*220px[\s\S]*max-width:\s*100%[\s\S]*height:\s*105px/)
  })
})

describe('EmployeeSkeleton home styles', () => {
  const card = block(skeleton, '.card')

  it('card without date and time is 122px: 37 top + 1 divider + 42 bottom + 2 gaps of 8 + 24 padding + 2 borders', () => {
    const total =
      num(block(skeleton, '.cardTop'), 'height') + 1 + num(block(skeleton, '.cardBottom'), 'height') + 2 * num(card, 'gap') + 2 * num(card, 'padding') + 2
    expect(num(block(skeleton, '.cardTop'), 'height')).toBe(37)
    expect(num(block(skeleton, '.cardBottom'), 'height')).toBe(42)
    expect(total).toBe(122)
  })

  it('card parts keep the MachineListCard paddings: 12px card, 8px above the bottom, 16px between fields, 28px action', () => {
    expect(num(card, 'padding')).toBe(num(block(listCard, '.card'), 'padding'))
    expect(num(card, 'gap')).toBe(num(block(listCard, '.card'), 'gap'))
    expect(num(block(skeleton, '.cardBottom'), 'padding-top')).toBe(num(block(listCard, '.bottom'), 'padding-top'))
    expect(num(block(skeleton, '.cardBottom'), 'gap')).toBe(num(block(listCard, '.bottom'), 'gap'))
    expect(num(block(skeleton, '.cardAction'), 'height')).toBe(num(block(listCard, '.action'), 'height'))
  })

  it('last machine card sits 8px under a 32px banner and is 60px tall, like the page', () => {
    expect(num(block(skeleton, '.last'), 'gap')).toBe(num(block(home, '.lastCard'), 'margin-top'))
    expect(num(block(skeleton, '.banner'), 'height')).toBe(num(block(home, '.banner'), 'min-height'))
    expect(num(block(skeleton, '.lastCard'), 'height')).toBe(60)
  })

  it('stat boxes are 82px tall and the available section keeps the 12px gap and 17px heading row', () => {
    expect(num(block(skeleton, '.box'), 'height')).toBe(82)
    expect(num(block(skeleton, '.available'), 'gap')).toBe(num(block(home, '.available'), 'gap'))
    expect(num(block(skeleton, '.sectionRow'), 'height')).toBe(17)
  })

  it('header lines add up to the title (34.8px) and subtitle lines (19px each) with the 4px page gap', () => {
    expect(num(block(skeleton, '.headerTitle'), 'height') + 2 * num(block(skeleton, '.headerTitle'), 'margin-block')).toBeCloseTo(34.8, 1)
    expect(num(block(skeleton, '.subtitleLine'), 'height') + 2 * num(block(skeleton, '.subtitleLine'), 'margin-block')).toBe(19)
    expect(num(block(skeleton, '.header'), 'gap')).toBe(num(block(home, '.header'), 'gap'))
  })

  it('shows only one subtitle line from 600px, where the real subtitle fits on one line', () => {
    expect(block(media(skeleton, 'min-width: 600px'), '.subtitleSecond')).toMatch(/display:\s*none/)
  })
})

describe('EmployeeSkeleton list and history styles', () => {
  it('card with date and time is 140px: 37 top + 1 divider + 60 bottom + 2 gaps of 8 + 24 padding + 2 borders', () => {
    const card = block(skeleton, '.card')
    const bottom = num(block(skeleton, '.cardExtra .cardBottom'), 'height')
    expect(bottom).toBe(60)
    expect(num(block(skeleton, '.cardTop'), 'height') + 1 + bottom + 2 * num(card, 'gap') + 2 * num(card, 'padding') + 2).toBe(140)
  })

  it('history column keeps the 12px page gap and the filters 8px apart, with 36px fields like the page', () => {
    expect(num(block(skeleton, '.history'), 'gap')).toBe(num(block(history, '.page'), 'gap'))
    expect(num(block(skeleton, '.filters'), 'gap')).toBe(num(block(history, '.filters'), 'gap'))
    expect(num(block(skeleton, '.filterField'), 'height')).toBe(num(block(history, '.field'), 'height'))
    expect(num(block(skeleton, '.times'), 'gap')).toBe(num(block(history, '.times'), 'gap'))
    expect(block(skeleton, '.times')).toMatch(/grid-template-columns:\s*1fr 1fr/)
  })

  it('"Filtros" title keeps the 4px top margin and the 15.3px line of the page heading', () => {
    const title = block(skeleton, '.filtersTitle')
    expect(block(history, '.filtersTitle')).toMatch(/margin:\s*4px 0 0/)
    expect(num(title, 'margin-top')).toBe(4)
    expect(num(title, 'height') + num(title, 'margin-top') + num(title, 'margin-bottom')).toBeCloseTo(4 + 15.3, 1)
  })
})

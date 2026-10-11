import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src', file), 'utf8')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''
const media = (css: string, query: string) => css.match(new RegExp(`@media \\(${query}\\)\\s*\\{([\\s\\S]*?\\n\\})`))?.[1] ?? ''

const skeleton = read('components/employee/EmployeeSkeleton.module.css')
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

  it('mirrors the card: 8px radius, line border, white background, about 120px tall', () => {
    const card = block(skeleton, '.card')
    expect(card).toMatch(/border-radius:\s*8px/)
    expect(card).toMatch(/border:\s*1px solid var\(--line\)/)
    expect(card).toMatch(/background:\s*var\(--white\)/)
    expect(card).toMatch(/min-height:\s*120px/)
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

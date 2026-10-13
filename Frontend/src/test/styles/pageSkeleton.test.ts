import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src', file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''
const px = (css: string, prop: string) => Number(css.match(new RegExp(`(?:^|[\\s;])${prop}:\\s*(\\d+)px`))?.[1])

const skeleton = read('components/common/PageSkeleton.module.css')
const machineCard = read('components/machines/MachineCard.module.css')
const overview = read('pages/VisaoGeralPage.module.css')

describe('PageSkeleton styles', () => {
  it('is a transparent shell so the toolbar and grid sit in the page layout', () => {
    expect(block(skeleton, '.wrapper')).toMatch(/display:\s*contents/)
  })

  it('machine card uses the MachineCard box: 12px padding, 1px border, 8px gap and radius', () => {
    const card = block(skeleton, '.machine')
    const real = block(machineCard, '.card')
    expect(card).toMatch(/padding:\s*12px/)
    expect(card).toMatch(/border:\s*1px solid var\(--border\)/)
    expect(card).toMatch(/border-radius:\s*var\(--radius-md\)/)
    expect(card).toMatch(/gap:\s*8px/)
    for (const rule of ['padding', 'border', 'border-radius', 'gap']) {
      expect(card.match(new RegExp(`${rule}:\\s*([^;]+)`))![1]).toBe(real.match(new RegExp(`${rule}:\\s*([^;]+)`))![1])
    }
  })

  it('machine card is 155px tall: 36px names, 39px details and 38px footer between 8px gaps', () => {
    const names = px(block(skeleton, '.machineName'), 'height') + px(block(skeleton, '.machineNames'), 'gap') + px(block(skeleton, '.machineId'), 'height')
    const total = names + px(block(skeleton, '.machineDetails'), 'height') + px(block(skeleton, '.machineFooter'), 'height')
    expect(names).toBe(36)
    expect(px(block(skeleton, '.machineDetails'), 'height')).toBe(39)
    expect(px(block(skeleton, '.machineFooter'), 'height')).toBe(38)
    expect(total + 2 * 8 + 2 * 12 + 2 * 1).toBe(155)
  })
})

describe('VisaoGeralPage skeleton toolbar styles', () => {
  it('search placeholder is 300px wide (shrinking to 160px) and 32px tall, like the real search', () => {
    const search = block(overview, '.searchSkeleton')
    expect(search).toMatch(/flex:\s*0 1 300px/)
    expect(search).toMatch(/min-width:\s*160px/)
    expect(search).toMatch(/height:\s*32px/)
    expect(block(overview, '.searchField')).toMatch(/flex:\s*0 1 300px/)
    expect(block(overview, '.searchInput')).toMatch(/height:\s*32px/)
  })

  it('select and button placeholders are 32px tall and do not shrink, like the real controls', () => {
    const controls = block(overview, '.selectSkeleton,\n.buttonSkeleton')
    expect(controls).toMatch(/height:\s*32px/)
    expect(controls).toMatch(/flex-shrink:\s*0/)
    expect(block(overview, '.statusSelect')).toMatch(/height:\s*32px/)
    expect(block(overview, '.registerButton')).toMatch(/height:\s*32px/)
  })
})

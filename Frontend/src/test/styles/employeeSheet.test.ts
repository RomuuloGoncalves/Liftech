import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = resolve(process.cwd(), 'src/components/employee')
const read = (file: string) => readFileSync(resolve(dir, file), 'utf8')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('BottomSheet styles', () => {
  const css = read('BottomSheet.module.css')

  it('blurs and tints the backdrop', () => {
    expect(block(css, '.backdrop')).toMatch(/backdrop-filter:\s*blur\(4px\)/)
    expect(block(css, '.backdrop')).toMatch(/background:\s*var\(--overlay\)/)
  })

  it('rounds the top corners by 24px on a white panel', () => {
    expect(block(css, '.sheet')).toMatch(/border-radius:\s*24px 24px 0 0/)
    expect(block(css, '.sheet')).toMatch(/background:\s*var\(--bg\)/)
  })

  it('centers at max 480px from 768px up', () => {
    expect(css).toMatch(/@media \(min-width: 768px\)\s*\{[\s\S]*max-width:\s*480px/)
  })

  it('uses no hex colors', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

describe('MachineListCard styles', () => {
  const css = read('MachineListCard.module.css')

  it.each([
    ['.disponivel', '--green-bg', '--green'],
    ['.em_uso', '--blue-bg', '--blue'],
    ['.manutencao', '--yellow-bg', '--yellow'],
    ['.offline', '--gray-bg', '--black-text'],
  ])('%s chip uses %s and %s from the shared StatusBadge', (selector, bg, color) => {
    const rule = block(readFileSync(resolve(dir, '../machines/StatusBadge.module.css'), 'utf8'), selector)
    expect(rule).toContain(`background: var(${bg})`)
    expect(rule).toContain(`color: var(${color})`)
  })

  it('chip is 11px with 2px 8px padding and 4px radius', () => {
    const chip = block(css, '.chip')
    expect(chip).toMatch(/padding:\s*2px 8px/)
    expect(chip).toMatch(/border-radius:\s*4px/)
    expect(chip).toMatch(/font-size:\s*var\(--fs-xs\)/)
  })

  it('action button is blue, 28px high, with radius 5px and shadow', () => {
    const action = block(css, '.action')
    expect(action).toMatch(/background:\s*var\(--blue\)/)
    expect(action).toMatch(/height:\s*28px/)
    expect(action).toMatch(/border-radius:\s*5px/)
    expect(action).toMatch(/box-shadow:\s*var\(--shadow\)/)
  })

  it('uses no hex colors', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })
})

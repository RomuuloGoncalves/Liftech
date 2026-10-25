import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/employee/MachineListCard.module.css'),
  'utf8',
)
const cardCss = readFileSync(
  resolve(process.cwd(), 'src/components/common/Card.module.css'),
  'utf8',
)

const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
const block = (selector: string) =>
  [...cleanCss.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('MachineListCard styles (CARD-06)', () => {
  it('uses shared card shell', () => {
    expectSharedShell(css, '.card', 'card')
  })

  it('has no literal border-radius: 8px', () => {
    expect(css).not.toMatch(/border-radius:\s*8px/)
  })

  it('does not define local .label or .value classes', () => {
    expect(css).not.toMatch(/\.label\b/)
    expect(css).not.toMatch(/\.value\b/)
  })

  it('does not cause horizontal scroll at 320px: .card and .bottom have min-width: 0', () => {
    expect(cardCss).toMatch(/min-width:\s*0/)
    expect(block('.bottom')).toMatch(/min-width:\s*0/)
  })

  it('.identificacao uses --text-label', () => {
    expect(block('.identificacao')).toMatch(/color:\s*var\(--text-label\)/)
  })

  it('.dateTime displays in column for two lines', () => {
    expect(block('.dateTime')).toMatch(/flex-direction:\s*column/)
  })
})

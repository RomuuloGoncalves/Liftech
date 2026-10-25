import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/common/Card.module.css'),
  'utf8',
)
const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
const block = (selector: string) =>
  [...cleanCss.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('Card.module.css shared shell (CARD-03)', () => {
  it('defines .card with exact shell rules', () => {
    const cardBlock = block('.card')
    expect(cardBlock).toMatch(/padding:\s*calc\(12\s*\*\s*var\(--px,\s*1px\)\);/)
    expect(cardBlock).toMatch(/gap:\s*calc\(8\s*\*\s*var\(--px,\s*1px\)\);/)
    expect(cardBlock).toMatch(/border:\s*var\(--card-border\);/)
    expect(cardBlock).toMatch(/border-radius:\s*calc\(8\s*\*\s*var\(--px,\s*1px\)\);/)
    expect(cardBlock).toMatch(/background:\s*var\(--card-bg\);/)
    expect(cardBlock).toMatch(/box-shadow:\s*none;/)
    expect(cardBlock).toMatch(/min-width:\s*0;/)
  })

  it('defines .cardLg with composes card, padding 16px and gap 12px', () => {
    const cardLgBlock = block('.cardLg')
    expect(cardLgBlock).toMatch(/composes:\s*card;/)
    expect(cardLgBlock).toMatch(/padding:\s*16px;/)
    expect(cardLgBlock).toMatch(/gap:\s*12px;/)
  })
})

describe('expectSharedShell helper (CARD-03)', () => {
  it('passes for a valid composes without shell properties and fails if padding is declared', () => {
    const validCss = `
      .card {
        composes: card from '../common/Card.module.css';
        position: relative;
        flex: 1;
      }
    `
    expect(() => expectSharedShell(validCss, '.card', 'card')).not.toThrow()

    const invalidPaddingCss = `
      .card {
        composes: card from '../common/Card.module.css';
        padding: 12px;
      }
    `
    expect(() => expectSharedShell(invalidPaddingCss, '.card', 'card')).toThrow()
  })
})

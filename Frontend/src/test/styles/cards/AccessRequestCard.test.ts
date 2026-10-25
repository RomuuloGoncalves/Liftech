import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/accessRequests/AccessRequestCard.module.css'),
  'utf8',
)
const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
const block = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = cleanCss.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

describe('AccessRequestCard shell (CARD-08, CARD-03)', () => {
  it('uses shared cardLg shell', () => {
    expectSharedShell(css, '.card', 'cardLg')
  })

  it('has no 0.5px border on .card or in the file', () => {
    const cardBlock = block('.card')
    expect(cardBlock).not.toContain('0.5px')
    expect(css).not.toMatch(/border(?:-[a-z]+)?\s*:\s*0\.5px/)
  })

  it('keeps .company as title --fs-lg and 600', () => {
    const companyBlock = block('.company')
    expect(companyBlock).toMatch(/font-size:\s*var\(--fs-lg\);/)
    expect(companyBlock).toMatch(/font-weight:\s*600;/)
    expect(companyBlock).toMatch(/color:\s*var\(--text-h\);/)
  })

  it('does not define local .label or .value styles (uses InfoField)', () => {
    expect(css).not.toMatch(/(?:^|\n|\})\s*\.label\s*\{/)
    expect(css).not.toMatch(/(?:^|\n|\})\s*\.value\s*\{/)
    expect(css).not.toMatch(/(?:^|\n|\})\s*\.detailRow\s*\{/)
    expect(css).not.toMatch(/(?:^|\n|\})\s*(?:dt|dd)\s*\{/)
  })

  it('has no hardcoded hex colors or non-bw rgb', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const coloured = [...css.matchAll(/rgba?\(([^)]*)\)/g)].filter(
      ([, args]) => !/^\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]?/.test(args + ')'),
    )
    expect(coloured).toEqual([])
  })
})

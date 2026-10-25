import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/team/SectorCard.module.css'),
  'utf8',
)
const block = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

describe('SectorCard shell (POL-01, RST-04, CARD-07)', () => {
  it('.card uses shared shell', () => {
    expectSharedShell(css, '.card', 'card')
  })

  it('does not contain 0.5px', () => {
    expect(css).not.toContain('0.5px')
  })

  it('sets flex layout for row orientation and center alignment', () => {
    const b = block('.card')
    expect(b).toMatch(/composes: (card|cardLg) row from/)
    expect(b).toContain('align-items: center;')
    expect(b).toContain('justify-content: space-between;')
  })
})

describe('SectorCard text scale (CARD-07)', () => {
  it('.name uses --fs-md, 600, --text-h', () => {
    const b = block('.name')
    expect(b).toContain('font-size: var(--fs-md);')
    expect(b).toContain('font-weight: 600;')
    expect(b).toContain('color: var(--text-h);')
  })

  it('.branch uses --fs-xs, --text-label', () => {
    const b = block('.branch')
    expect(b).toContain('font-size: var(--fs-xs);')
    expect(b).toContain('color: var(--text-label);')
  })
})

describe('SectorCard buttons and styles (RST-08, RST-11)', () => {
  it('SectorCard delete is a filled --danger-solid square with a white icon', () => {
    const b = block('.delete')
    expect(b).toMatch(/background:\s*var\(--danger-solid\)/)
    expect(block('.iconButton')).toMatch(/color:\s*var\(--white\)/)
  })

  it('SectorCard edit is a filled --blue square with a white icon', () => {
    const b = block('.edit')
    expect(b).toMatch(/background:\s*var\(--blue\)/)
    expect(block('.iconButton')).toMatch(/color:\s*var\(--white\)/)
  })

  it('SectorCard action buttons are ~25px squares', () => {
    const b = block('.iconButton')
    expect(b).toMatch(/width:\s*25px/)
    expect(b).toMatch(/height:\s*25px/)
  })

  it('does not keep the icon box CSS', () => {
    expect(css).not.toMatch(/^\.icon\s*\{/m)
  })

  it('has no hex colour and no coloured rgba', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const coloured = [...css.matchAll(/rgba?\(([^)]*)\)/g)].filter(
      ([, args]) => !/^\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]?/.test(args + ')'),
    )
    expect(coloured).toEqual([])
  })
})

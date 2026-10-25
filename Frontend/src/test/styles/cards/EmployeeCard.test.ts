import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/team/EmployeeCard.module.css'),
  'utf8',
)
const block = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

describe('EmployeeCard shell (POL-01, RST-04, CARD-07)', () => {
  it('.card uses shared shell', () => {
    expectSharedShell(css, '.card', 'card')
  })

  it('does not contain 0.5px', () => {
    expect(css).not.toContain('0.5px')
  })

  it('sets flex layout for row orientation', () => {
    const b = block('.card')
    expect(b).toMatch(/composes: (card|cardLg) row from/)
    expect(b).toContain('align-items: stretch;')
    expect(b).toContain('justify-content: space-between;')
  })
})

describe('EmployeeCard controls and tokens (RST-08, RST-11, CARD-07)', () => {
  it('name uses font-weight 600', () => {
    const b = block('.name')
    expect(b).toContain('font-weight: 600;')
  })

  it('code uses --text-label', () => {
    const b = block('.code')
    expect(b).toMatch(/color:\s*var\(--text-label\)/)
  })

  it('icons, access text and toggle use the tokens', () => {
    expect(block('.delete')).toMatch(/color:\s*var\(--danger-solid\)/)
    expect(block('.edit')).toMatch(/color:\s*var\(--blue\)/)
    expect(block('.allowed')).toMatch(/color:\s*var\(--blue\)/)
    expect(block('.denied')).toMatch(/color:\s*var\(--red\)/)
    expect(block('.switchOn')).toMatch(/background:\s*var\(--blue\)/)
  })

  it('does not keep the avatar box CSS', () => {
    expect(css).not.toMatch(/^\.avatar\s*\{/m)
  })

  it('has no hex colour and no coloured rgba', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const coloured = [...css.matchAll(/rgba?\(([^)]*)\)/g)].filter(
      ([, args]) => !/^\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]?/.test(args + ')'),
    )
    expect(coloured).toEqual([])
  })
})

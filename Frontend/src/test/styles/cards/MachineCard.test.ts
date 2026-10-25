import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/machines/MachineCard.module.css'),
  'utf8',
)
const block = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

describe('MachineCard shell (CARD-03, CARD-04)', () => {
  it('uses shared shell (.card)', () => {
    expectSharedShell(css, '.card', 'card')
  })

  it('keeps position: relative for the hit area', () => {
    expect(block('.card')).toContain('position: relative;')
  })
})

describe('MachineCard typography and colors (CARD-04)', () => {
  it('title is 13px, weight 600, --accent, on one line with an ellipsis', () => {
    const b = block('.nome')
    expect(b).toContain('font-size: var(--fs-md);')
    expect(b).toContain('font-weight: 600;')
    expect(b).toContain('color: var(--accent);')
    expect(b).toContain('white-space: nowrap;')
    expect(b).toContain('overflow: hidden;')
    expect(b).toContain('text-overflow: ellipsis;')
    expect(b).not.toContain('line-clamp')
  })

  it('identificacao uses --fs-xs and --text-label', () => {
    const b = block('.identificacao')
    expect(b).toContain('font-size: var(--fs-xs);')
    expect(b).toContain('color: var(--text-label);')
  })

  it('does not style dt, dd, or detailRow in the module', () => {
    expect(css).not.toMatch(/(?:^|\})\s*(?:[^{}]*,\s*)*dt\b/)
    expect(css).not.toMatch(/(?:^|\})\s*(?:[^{}]*,\s*)*dd\b/)
    expect(css).not.toMatch(/\.detailRow\b/)
  })
})

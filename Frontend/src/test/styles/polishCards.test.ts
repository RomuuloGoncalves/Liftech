import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8')
const block = (file: string, selector: string) => {
  const escaped = selector.replace(/[.]/g, '\\.')
  const m = read(file).match(new RegExp(`(?:^|\\n)${escaped}\\s*{([^}]*)}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

const machine = 'components/machines/MachineCard.module.css'

describe('standard card: padding 12, radius 8, gap 8 (POL-01)', () => {
  it.each([
    machine,
    'components/team/EmployeeCard.module.css',
    'components/team/SectorCard.module.css',
  ])('%s .card', (file) => {
    const b = block(file, '.card')
    expect(b).toContain('padding: 12px;')
    expect(b).toMatch(/border-radius: (8px|var\(--radius-md\));/)
    expect(b).toContain('gap: 8px;')
  })

  it('--radius-md is 8px', () => {
    expect(read('index.css')).toMatch(/--radius-md:\s*8px;/)
  })
})

describe('MachineCard text scale (POL-01)', () => {
  it('title is 13px, weight 600, on one line with an ellipsis', () => {
    const b = block(machine, '.nome')
    expect(b).toContain('font-size: var(--fs-md);')
    expect(b).toContain('font-weight: 600;')
    expect(b).toContain('white-space: nowrap;')
    expect(b).toContain('overflow: hidden;')
    expect(b).toContain('text-overflow: ellipsis;')
    expect(b).not.toContain('line-clamp')
  })

  it('--fs-md is 13px', () => {
    expect(read('index.css')).toMatch(/--fs-md:\s*13px;/)
  })

  it('labels use --fs-xs and values use --fs-sm', () => {
    expect(block(machine, '.detailRow dt')).toContain('font-size: var(--fs-xs);')
    expect(block(machine, '.detailRow dd')).toContain('font-size: var(--fs-sm);')
  })

  it('session time uses --fs-base', () => {
    expect(block(machine, '.session strong')).toContain('font-size: var(--fs-base);')
  })

  it('status badge uses --fs-xs with padding 2px 8px', () => {
    const b = block('components/machines/StatusBadge.module.css', '.badge')
    expect(b).toContain('font-size: var(--fs-xs);')
    expect(b).toContain('padding: 2px 8px;')
  })
})

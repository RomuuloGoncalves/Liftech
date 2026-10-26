import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8')
const block = (file: string, selector: string) => {
  const escaped = selector.replace(/[.]/g, '\\.')
  const m = read(file).match(new RegExp(`(?:^|\\n)${escaped}\\s*{([^}]*)}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ')
}

describe('standard card tokens (POL-01)', () => {
  it('--radius-md is 8px', () => {
    expect(read('index.css')).toMatch(/--radius-md:\s*8px;/)
  })
})

describe('typography tokens and status badge (POL-01)', () => {
  it('--fs-md is 13px', () => {
    expect(read('index.css')).toMatch(/--fs-md:\s*13px;/)
  })

  it('status badge uses --fs-xs with padding 2px 8px', () => {
    const b = block('components/machines/StatusBadge.module.css', '.badge')
    expect(b).toContain('font-size: var(--fs-xs);')
    expect(b).toContain('padding: 2px 8px;')
  })
})

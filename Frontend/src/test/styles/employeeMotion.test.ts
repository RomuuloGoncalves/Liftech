import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), `src/components/employee/${file}`), 'utf8')
const rule = (css: string, selector: string) =>
  css.match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
const reduced = (css: string) => css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'))
const curve = 'cubic-bezier(0.23, 1, 0.32, 1)'

describe('Employee motion styles', () => {
  const bar = read('TabBar.module.css')
  const layout = read('EmployeeLayout.module.css')

  it('indicator moves by translateX with a 250ms transition', () => {
    const b = rule(bar, '.indicator')
    expect(b).toContain('translateX(calc(var(--tab-index)')
    expect(b).toContain(`transform 250ms ${curve}`)
    expect(b).toContain('opacity 150ms ease')
  })

  it('hidden indicator has opacity 0', () => {
    expect(rule(bar, '.hidden')).toContain('opacity: 0')
  })

  it('active icon turns white and scales to 1.08 in 200ms', () => {
    expect(rule(bar, '.icon')).toContain('transform 200ms')
    const b = rule(bar, '.active .icon')
    expect(b).toContain('color: var(--white)')
    expect(b).toContain('scale(1.08)')
  })

  it('content enters with a 200ms fade and 8px rise', () => {
    expect(rule(layout, '.enter')).toContain(`animation: enter 200ms ${curve} both`)
    const frames = layout.match(/@keyframes enter \{([\s\S]*?)\n\}/)?.[1] ?? ''
    expect(frames).toContain('opacity: 0')
    expect(frames).toContain('translateY(8px)')
    expect(frames).toContain('opacity: 1')
  })

  it('reduced motion removes the transitions and the entry animation', () => {
    const tabs = reduced(bar)
    expect(tabs).toMatch(/\.indicator,\s*\.icon \{[^}]*transition: none/)
    expect(reduced(layout)).toMatch(/\.enter \{[^}]*animation: none/)
  })
})

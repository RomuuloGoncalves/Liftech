import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const block = (selector: string) => {
  const found = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find(([, s]) => s.replace(/\s+/g, ' ').trim() === selector)
  return found ? found[2].replace(/\s+/g, ' ').trim() : ''
}

describe('index.css harmony foundation (HARM-01..04, HARM-18)', () => {
  it.each([
    ['--text-muted', 'var(--text-label)'],
    ['--blue-text', '#1f78d1'],
    ['--danger-text', 'var(--urgency-critical)'],
    ['--yellow-text', '#726800'],
    ['--tracking-display', '-0.01em'],
    ['--ease-out', 'cubic-bezier(0.23, 1, 0.32, 1)'],
    ['--dur-fast', '120ms'],
    ['--dur-base', '180ms'],
    ['--dur-slow', '220ms'],
  ])('defines %s as %s', (token, value) => {
    expect(css).toContain(`${token}: ${value};`)
  })

  it('controls inherit the family and tracking instead of a * reset', () => {
    expect(block('button, input, select, textarea')).toBe('font-family: inherit; letter-spacing: inherit;')
    expect(css).not.toMatch(/\*\s*\{\s*font-family/)
  })

  it('placeholders use the label color at full opacity', () => {
    expect(block('::placeholder')).toBe('color: var(--text-label); opacity: 1;')
  })

  it('headings drop body tracking, share line-height and balance', () => {
    expect(block('h1, h2, h3')).toBe('letter-spacing: 0; line-height: 1.25; text-wrap: balance;')
    expect(block('h2')).not.toContain('118%')
  })

  it('paragraphs wrap pretty', () => {
    expect(block('p')).toBe('margin: 0; text-wrap: pretty;')
  })
})

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const norm = (v: string) => v.replace(/\s+/g, '').toLowerCase()
const token = (name: string) => {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`))
  return m ? norm(m[1]) : undefined
}

describe('Style Guide tokens (RST-01)', () => {
  it.each([
    ['blue', '#3a9cff'],
    ['blue-bg', 'rgba(58,156,255,0.25)'],
    ['gray-border', 'rgba(21,28,39,0.1)'],
    ['gray-bg', '#fafafa'],
    ['white', '#fff'],
    ['red', '#ff0000'],
    ['red-bg', 'rgba(255,58,58,0.25)'],
    ['yellow', '#e5d000'],
    ['yellow-bg', 'rgba(255,245,139,0.25)'],
    ['green', '#1e8021'],
    ['green-bg', 'rgba(74,255,58,0.25)'],
    ['black-title', '#181818'],
    ['black-text', '#4c4c4c'],
  ])('declares --%s as %s', (name, value) => {
    expect(token(name)).toBe(value)
  })

  it.each([
    ['danger-solid', '#ef4444'],
    ['urgency-critical', '#c84646'],
    ['urgency-high', '#d4773f'],
    ['urgency-medium', '#ffc415'],
    ['line', '#e3e4e5'],
    ['sidebar-line', '#eeeff0'],
    ['overlay', 'rgba(245,245,245,0.55)'],
    ['bg-page', 'var(--gray-bg)'],
  ])('declares measured token --%s as %s', (name, value) => {
    expect(token(name)).toBe(value)
  })
})

describe('Base colors (RST-04, RST-05)', () => {
  it('paints the page with --bg-page and keeps --bg white for surfaces', () => {
    const root = css.match(/:root\s*{[^}]*}/s)?.[0] ?? ''
    expect(norm(root)).toContain('background:var(--bg-page);')
    expect(token('bg')).toBe('var(--white)')
  })

  it('maps title and body text to the guide blacks', () => {
    expect(token('text-h')).toBe('var(--black-title)')
    expect(token('text')).toBe('var(--black-text)')
  })
})

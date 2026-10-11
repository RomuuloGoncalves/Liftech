import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')
const firstFamily = (name: string) => css.match(new RegExp(`--${name}:\\s*([^,;]+)`))?.[1].trim()

describe('Host Grotesk (RST-02)', () => {
  it('loads Host Grotesk from Google Fonts and drops Inter and Lexend', () => {
    expect(html).toContain('family=Host+Grotesk')
    expect(html).not.toMatch(/family=Inter|family=Lexend/)
  })

  it("uses 'Host Grotesk' as the first family of --sans and --heading", () => {
    expect(firstFamily('sans')).toBe("'Host Grotesk'")
    expect(firstFamily('heading')).toBe("'Host Grotesk'")
  })

  it('keeps system-ui as the fallback so a failed font load does not break layout', () => {
    expect(css).toMatch(/--sans:[^;]*system-ui/)
    expect(css).toMatch(/--heading:[^;]*system-ui/)
  })
})

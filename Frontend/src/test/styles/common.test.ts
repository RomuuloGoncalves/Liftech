import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = resolve(process.cwd(), 'src/components/common')
const read = (file: string) => readFileSync(resolve(dir, file), 'utf8')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('DialogButtons (RST-08)', () => {
  const css = read('DialogButtons.module.css')

  it('.cancel uses --danger-solid', () => {
    expect(block(css, '.cancel')).toMatch(/background:\s*var\(--danger-solid\)/)
  })

  it('.confirm uses --blue', () => {
    expect(block(css, '.confirm')).toMatch(/background:\s*var\(--blue\)/)
  })

  it('button text uses --white', () => {
    expect(css).toMatch(/color:\s*var\(--white\)/)
  })
})

describe('Modal (RST-09)', () => {
  const css = read('Modal.module.css')

  it('overlay uses --overlay', () => {
    expect(block(css, '.backdrop')).toMatch(/background:\s*var\(--overlay\)/)
  })

  it('dialog box is white (--bg)', () => {
    expect(block(css, '.dialog')).toMatch(/background:\s*var\(--bg\)/)
  })

  it('footer uses --bg-page', () => {
    expect(block(css, '.footer')).toMatch(/background:\s*var\(--bg-page\)/)
  })
})

describe('components/common has no hardcoded colors', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.css'))

  it.each(files)('%s has no #hex', (file) => {
    expect(read(file)).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
  })

  it.each(files)('%s has only black/white rgba', (file) => {
    const bad = (read(file).match(/rgba\([^)]*\)/g) ?? []).filter(
      (v) => !/^rgba\(\s*(0,\s*0,\s*0|255,\s*255,\s*255)\s*,/.test(v),
    )
    expect(bad).toEqual([])
  })
})

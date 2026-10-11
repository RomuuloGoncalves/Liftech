import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(process.cwd(), 'src')
// Gradientes de auth ficam fora da regra de hex; index.css é a fonte dos tokens.
const HEX_ALLOWED = new Set(['index.css', 'components/auth/AuthLayout.module.css', 'components/auth/AuthForm.module.css'])

const cssFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'test' ? [] : cssFiles(path)
    return name.endsWith('.css') ? [path] : []
  })

const files = cssFiles(SRC).map((path) => ({ rel: relative(SRC, path), css: readFileSync(path, 'utf8') }))

describe('no hardcoded colors outside the tokens (RST-03)', () => {
  it('finds the CSS files', () => {
    expect(files.length).toBeGreaterThan(20)
  })

  it('declares hex colors only in index.css and the auth gradients', () => {
    const offenders = files
      .filter(({ rel, css }) => !HEX_ALLOWED.has(rel) && /#[0-9a-fA-F]{3,8}\b/.test(css))
      .map(({ rel }) => rel)
    expect(offenders).toEqual([])
  })

  it('uses rgb()/rgba() with channels other than black or white only in index.css', () => {
    const colored = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g
    const offenders = files
      .filter(({ rel }) => rel !== 'index.css')
      .filter(({ css }) =>
        [...css.matchAll(colored)].some(([, r, g, b]) => !(r === g && g === b && (r === '0' || r === '255'))),
      )
      .map(({ rel }) => rel)
    expect(offenders).toEqual([])
  })
})

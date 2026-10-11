import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/components/auth/${file}`), 'utf8')
const layout = read('AuthLayout.module.css')
const form = read('AuthForm.module.css')

const block = (css: string, selector: string) => {
  const m = css.match(new RegExp(`(?:^|\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))
  return m ? m[1] : ''
}

const fixedWidths = (body: string) =>
  [...body.matchAll(/(?:^|[\s;])width:\s*(\d+)px/g)].map((m) => Number(m[1]))

describe('Login em 320px (EMP-04 AC3)', () => {
  it('nenhum bloco do login fixa largura em px maior que 320', () => {
    for (const [css, selectors] of [
      [layout, ['.page', '.formContent', '.header', '.subtitle', '.tabs', '.tab', '.title']],
      [form, ['.form', '.input', '.submitButton']],
    ] as const) {
      for (const selector of selectors) {
        for (const w of fixedWidths(block(css, selector))) expect(w, selector).toBeLessThanOrEqual(320)
      }
    }
  })

  it('.page e .formContent não passam da largura da tela', () => {
    expect(block(layout, '.page')).toContain('box-sizing: border-box')
    expect(block(layout, '.page')).toContain('width: 100%')
    const content = block(layout, '.formContent')
    expect(content).toContain('width: 100%')
    expect(content).toContain('min-width: 0')
  })

  it('.subtitle limita a largura ao contêiner', () => {
    const b = block(layout, '.subtitle')
    expect(b).toContain('width: min(340px, 100%)')
    expect(b).toContain('max-width: 100%')
    expect(b).not.toContain('100vw')
  })

  it('abas encolhem e o título quebra abaixo de 360px', () => {
    expect(block(layout, '.tabs')).toContain('min-width: 0')
    expect(block(layout, '.tab')).toContain('min-width: 0')
    expect(block(layout, '.tab')).toContain('text-overflow: ellipsis')
    const small = layout.match(/@media \(max-width: 359px\)\s*\{([\s\S]*?)\n\}\n/)?.[1] ?? ''
    expect(small).toContain('white-space: normal')
  })

  it('o painel informativo (hero) fica oculto abaixo de 900px', () => {
    expect(block(layout, '.hero')).toContain('display: none')
    expect(layout).toMatch(/@media \(min-width: 900px\)\s*\{\s*\.hero\s*\{\s*display: flex;/)
  })
})

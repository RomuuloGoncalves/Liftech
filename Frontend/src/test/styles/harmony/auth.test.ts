import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const declarations = (css: string, selector: string) => {
  const stripped = css.replace(/@media[^{]*\{/g, '')
  const blocks = [...stripped.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  return blocks
    .filter(([, selectors]) => selectors.split(',').some((s) => s.trim() === selector))
    .map(([, , body]) => body.replace(/\s+/g, ' ').trim())
    .join(' ')
}

describe('AuthLayout.module.css harmony (HARM-04, HARM-08, HARM-09, HARM-11)', () => {
  const css = read('components/auth/AuthLayout.module.css')

  it('no color declarations use hex', () => {
    expect(css).not.toMatch(/color:\s*#[0-9a-fA-F]{3,8}\b/)
  })

  it('.page removes font-family, letter-spacing: 0, and line-height: 1.3', () => {
    const page = declarations(css, '.page')
    expect(page).not.toContain('font-family:')
    expect(page).not.toContain('letter-spacing:')
    expect(page).not.toContain('line-height:')
  })

  it('.title wraps, uses tracking-display, and uses --blue', () => {
    const title = declarations(css, '.title')
    expect(title).toContain('white-space: normal;')
    expect(title).toContain('letter-spacing: var(--tracking-display);')
    expect(title).toContain('color: var(--blue);')
    expect(title).not.toContain('white-space: nowrap;')
    expect(title).not.toContain('-0.4px')
    expect(title).not.toContain('#41a8ff')
  })

  it('.subtitle uses 1.45 line-height and --text', () => {
    const sub = declarations(css, '.subtitle')
    expect(sub).toContain('line-height: 1.45;')
    expect(sub).toContain('color: var(--text);')
    expect(sub).not.toContain('line-height: 16px;')
    expect(sub).not.toContain('#4c4c4c')
  })

  it('.tab uses weight 600, --blue-text, --line border, and --white background', () => {
    const tab = declarations(css, '.tab')
    expect(tab).toContain('font-weight: 600;')
    expect(tab).toContain('color: var(--blue-text);')
    expect(tab).toContain('border: 1px solid var(--line);')
    expect(tab).toContain('background: var(--white);')
    expect(tab).not.toContain('font-weight: bold;')
    expect(tab).not.toContain('#3a9cff')
    expect(tab).not.toContain('#e3e3e3')
    expect(tab).not.toMatch(/background:\s*#fff;/)
  })

  it('.tabActive and .hero use --white for color', () => {
    expect(declarations(css, '.tabActive')).toContain('color: var(--white);')
    expect(declarations(css, '.hero')).toContain('color: var(--white);')
  })

  it('.heroTitle uses tracking-display and --white', () => {
    const heroTitle = declarations(css, '.heroTitle')
    expect(heroTitle).toContain('letter-spacing: var(--tracking-display);')
    expect(heroTitle).toContain('color: var(--white);')
    expect(heroTitle).not.toContain('-0.3px')
  })

  it('.heroSubtitle uses line-height 1.45', () => {
    const heroSub = declarations(css, '.heroSubtitle')
    expect(heroSub).toContain('line-height: 1.45;')
    expect(heroSub).not.toContain('17px')
  })

  it('.infoCard, .infoIcon, .infoCardTitle, and .infoCardDesc use proper tokens', () => {
    expect(declarations(css, '.infoCard')).toContain('color: var(--text-h);')
    expect(declarations(css, '.infoIcon')).toContain('color: var(--blue);')
    expect(declarations(css, '.infoCardTitle')).toContain('line-height: 1.3;')
    expect(declarations(css, '.infoCardDesc')).toContain('line-height: 1.35;')
    expect(declarations(css, '.infoCardDesc')).toContain('color: var(--text);')
  })
})

describe('AuthForm.module.css harmony (HARM-03, HARM-05, HARM-06, HARM-08, HARM-11, HARM-20)', () => {
  const css = read('components/auth/AuthForm.module.css')

  it('no color declarations use hex', () => {
    expect(css).not.toMatch(/color:\s*#[0-9a-fA-F]{3,8}\b/)
  })

  it('drops local ::placeholder rule and weights 300/700', () => {
    expect(css).not.toContain('::placeholder')
    expect(css).not.toContain('font-weight: 300')
    expect(css).not.toContain('font-weight: 700')
  })

  it('.labelAccent uses --fs-sm and --blue-text', () => {
    const label = declarations(css, '.labelAccent')
    expect(label).toContain('font-size: var(--fs-sm);')
    expect(label).toContain('color: var(--blue-text);')
    expect(label).not.toContain('var(--fs-xs)')
    expect(label).not.toContain('#3a9cff')
  })

  it('.input uses 1px solid var(--line) and var(--white)', () => {
    const input = declarations(css, '.input')
    expect(input).toContain('border: 1px solid var(--line);')
    expect(input).toContain('background: var(--white);')
    expect(input).not.toContain('#dedede')
    expect(input).not.toMatch(/background:\s*#fff;/)
  })

  it('.sectionTitle uses --text-h', () => {
    const st = declarations(css, '.sectionTitle')
    expect(st).toContain('color: var(--text-h);')
    expect(st).not.toContain('#333')
  })

  it('.submitButton uses var(--white) and tokens for transition', () => {
    const btn = declarations(css, '.submitButton')
    expect(btn).toContain('color: var(--white);')
    expect(btn).toContain('transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);')
    expect(btn).not.toContain('120ms ease')
  })

  it('.forgotLink uses --blue-text and font-weight 500', () => {
    const link = declarations(css, '.forgotLink')
    expect(link).toContain('color: var(--blue-text);')
    expect(link).toContain('font-weight: 500;')
    expect(link).not.toContain('#3a9cff')
  })

  it('.successTitle uses font-weight 600', () => {
    const st = declarations(css, '.successTitle')
    expect(st).toContain('font-weight: 600;')
  })
})

describe('NotFoundPage.module.css harmony (HARM-06, HARM-19, HARM-20)', () => {
  const css = read('pages/NotFoundPage.module.css')

  it('.cta uses button-lg role (--fs-md) and motion tokens', () => {
    const cta = declarations(css, '.cta')
    expect(cta).toContain('font-size: var(--fs-md);')
    expect(cta).toContain('transition: opacity var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);')
    expect(cta).not.toContain('var(--fs-base)')
    expect(cta).not.toContain('120ms')
    expect(css).not.toContain('var(--ease-out,')
    expect(css).not.toContain('cubic-bezier')
  })
})

describe('NotFoundPage.module.css forklift layout (NF2-01, NF2-10)', () => {
  const css = read('pages/NotFoundPage.module.css')

  it('.illustration is 220px wide and never wider than the screen', () => {
    const art = declarations(css, '.illustration')
    expect(art).toContain('width: 220px;')
    expect(art).toContain('max-width: 100%;')
    expect(css).not.toMatch(/\.icon\s*\{/)
  })

  it('.title balances long translations and .description wraps pretty', () => {
    expect(declarations(css, '.title')).toContain('text-wrap: balance;')
    expect(declarations(css, '.description')).toContain('text-wrap: pretty;')
  })
})

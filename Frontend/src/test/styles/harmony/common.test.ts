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

describe('Modal.module.css harmony (HARM-12, HARM-19, HARM-21)', () => {
  const css = read('components/common/Modal.module.css')

  it('.title drops letter-spacing: 0', () => {
    expect(declarations(css, '.title')).not.toContain('letter-spacing:')
  })

  it('.footer uses padding 16px 30px', () => {
    const footer = declarations(css, '.footer')
    expect(footer).toContain('padding: 16px 30px;')
    expect(footer).not.toContain('15px')
  })

  it('.titleGroup uses gap 8px', () => {
    const tg = declarations(css, '.titleGroup')
    expect(tg).toContain('gap: 8px;')
    expect(tg).not.toContain('10px')
  })

  it('.backdrop and .dialog use motion tokens without cubic-bezier fallback', () => {
    expect(declarations(css, '.backdrop')).toContain('animation: fade-in var(--dur-base) var(--ease-out);')
    expect(declarations(css, '.dialog')).toContain('animation: dialog-in var(--dur-base) var(--ease-out);')
    expect(css).not.toContain('cubic-bezier')
    expect(css).not.toContain('150ms ease-out')
  })
})

describe('DialogButtons.module.css harmony (HARM-13)', () => {
  const css = read('components/common/DialogButtons.module.css')

  it('.cancel and .confirm use compact button padding 8px 16px', () => {
    const cancel = declarations(css, '.cancel')
    const confirm = declarations(css, '.confirm')
    expect(cancel).toContain('padding: 8px 16px;')
    expect(confirm).toContain('padding: 8px 16px;')
    expect(css).not.toContain('padding: 8px 18px;')
  })
})

describe('Toast.module.css harmony (HARM-21)', () => {
  const css = read('components/common/Toast.module.css')

  it('.toast animates with var(--dur-base) var(--ease-out)', () => {
    const toast = declarations(css, '.toast')
    expect(toast).toContain('animation: toast-in var(--dur-base) var(--ease-out);')
    expect(toast).not.toContain('180ms ease-out')
  })
})

describe('Select.module.css harmony (HARM-05, HARM-20)', () => {
  const css = read('components/common/Select.module.css')

  it('.button, .chevron, and .option use var(--dur-fast) var(--ease-out)', () => {
    expect(declarations(css, '.button')).toContain('transition: border-color var(--dur-fast) var(--ease-out);')
    expect(declarations(css, '.chevron')).toContain('transition: transform var(--dur-fast) var(--ease-out);')
    expect(declarations(css, '.option')).toContain('transition: background-color var(--dur-fast) var(--ease-out);')
    expect(css).not.toContain('0.15s ease')
    expect(css).not.toContain('0.1s ease')
  })

  it('.button removes redundant font-family: inherit', () => {
    expect(declarations(css, '.button')).not.toContain('font-family:')
  })

  it('.checkmark uses weight 600 and file has no weight 700 or local reduced-motion', () => {
    expect(declarations(css, '.checkmark')).toContain('font-weight: 600;')
    expect(css).not.toContain('font-weight: 700')
    expect(css).not.toContain('prefers-reduced-motion')
  })
})

describe('Card.module.css harmony (HARM-16)', () => {
  const css = read('components/common/Card.module.css')

  it('.cardLg uses var(--card-pad-lg) and var(--card-gap-lg)', () => {
    const cardLg = declarations(css, '.cardLg')
    expect(cardLg).toContain('padding: var(--card-pad-lg);')
    expect(cardLg).toContain('gap: var(--card-gap-lg);')
    expect(cardLg).not.toContain('padding: 16px;')
    expect(cardLg).not.toContain('gap: 12px;')
  })
})

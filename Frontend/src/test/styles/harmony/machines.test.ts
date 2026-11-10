import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), `src/${file}`), 'utf8')

const declarations = (file: string, selector: string) => {
  const css = read(file).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@media[^{]*\{/g, '')
  const blocks = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
  return blocks
    .filter(([, selectors]) => selectors.split(',').some((s) => s.trim() === selector))
    .map(([, , body]) => body.replace(/\s+/g, ' ').trim())
    .join(' ')
}

describe('NewMachinePanel harmony (T33, HARM-06, HARM-11, HARM-19, HARM-21)', () => {
  const file = 'components/machines/NewMachinePanel.module.css'

  it('title uses modal-title weight 500', () => {
    const body = declarations(file, '.title')
    expect(body).toContain('font-weight: 500;')
    expect(body).not.toContain('font-weight: 600;')
  })

  it('label uses field-label size var(--fs-sm)', () => {
    const body = declarations(file, '.label')
    expect(body).toContain('font-size: var(--fs-sm);')
    expect(body).not.toContain('font-size: var(--fs-md);')
  })

  it('input uses control size var(--fs-md)', () => {
    const body = declarations(file, '.input')
    expect(body).toContain('font-size: var(--fs-md);')
    expect(body).not.toContain('font-size: var(--fs-base);')
  })

  it('submitButton uses button-lg size var(--fs-md)', () => {
    const body = declarations(file, '.submitButton')
    expect(body).toContain('font-size: var(--fs-md);')
    expect(body).not.toContain('font-size: var(--fs-base);')
  })

  it('cancelButton uses accessible danger color var(--danger-text)', () => {
    const body = declarations(file, '.cancelButton')
    expect(body).toContain('color: var(--danger-text);')
    expect(body).not.toContain('color: var(--red);')
  })

  it('backdrop animates with fade-in and tokens', () => {
    const body = declarations(file, '.backdrop')
    expect(body).toContain('animation: fade-in var(--dur-base) var(--ease-out);')
  })

  it('defines fade-in keyframe and panel-in uses token without fallback', () => {
    const raw = read(file)
    expect(raw).toMatch(/@keyframes\s+fade-in\s*\{\s*from\s*\{\s*opacity:\s*0;\s*\}\s*\}/)
    expect(declarations(file, '.panel')).toContain('animation: panel-in 220ms var(--ease-out);')
    expect(raw).not.toContain('var(--ease-out,')
    expect(raw).not.toContain('cubic-bezier(0.23, 1, 0.32, 1)')
  })
})

describe('MachineCard harmony (T34, HARM-06, HARM-11)', () => {
  const file = 'components/machines/MachineCard.module.css'

  it('nome keeps the brand blue var(--accent) with line-height 1.3', () => {
    const body = declarations(file, '.nome')
    expect(body).toContain('color: var(--accent);')
    expect(body).toContain('line-height: 1.3;')
    expect(body).not.toContain('line-height: 130%;')
  })
})

describe('LevelInfoModal harmony (T35, HARM-06)', () => {
  const file = 'components/alerts/LevelInfoModal.module.css'

  it('level uses scale token var(--fs-lg) instead of literal 16px', () => {
    const body = declarations(file, '.level')
    expect(body).toContain('font-size: var(--fs-lg);')
    expect(body).not.toContain('16px')
  })
})

describe('FeedbackModal harmony (T36, HARM-03, HARM-06)', () => {
  const file = 'components/feedback/FeedbackModal.module.css'

  it('textarea uses control size var(--fs-md)', () => {
    const body = declarations(file, '.textarea')
    expect(body).toContain('font-size: var(--fs-md);')
    expect(body).not.toContain('font-size: var(--fs-sm);')
  })

  it('drops component ::placeholder rule', () => {
    const raw = read(file)
    expect(raw).not.toContain('::placeholder')
  })
})

describe('VisaoGeralPage harmony (T37, HARM-20)', () => {
  const file = 'pages/VisaoGeralPage.module.css'

  it('registerButton uses token motion and active scale', () => {
    const body = declarations(file, '.registerButton')
    expect(body).toContain('transition: transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out);')
    expect(declarations(file, '.registerButton:active')).toContain('transform: scale(0.97);')
    expect(declarations(file, '.registerButton:hover')).toContain('opacity: 0.92;')
  })
})

describe('FrotaPage harmony (T38, HARM-03, HARM-20)', () => {
  const file = 'pages/FrotaPage.module.css'

  it('createButton uses token motion and active scale', () => {
    const body = declarations(file, '.createButton')
    expect(body).toContain('transition: transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out);')
    expect(declarations(file, '.createButton:active')).toContain('transform: scale(0.97);')
    expect(declarations(file, '.createButton:hover')).toContain('opacity: 0.92;')
  })

  it('drops placeholder rule with color-mix from search', () => {
    const raw = read(file)
    expect(raw).not.toContain('color-mix')
  })
})

describe('InitialPasswordModal harmony (T39, HARM-06)', () => {
  const file = 'components/accessRequests/InitialPasswordModal.tsx'

  it('uses --mono and --fs-sm instead of monospace and --fs-xs', () => {
    const raw = read(file)
    expect(raw).toContain("fontFamily: 'var(--mono)'")
    expect(raw).not.toContain("fontFamily: 'monospace'")
    expect(raw).toContain("fontSize: 'var(--fs-sm)'")
    expect(raw).not.toContain("fontSize: 'var(--fs-xs)'")
    expect(raw).toContain('lineHeight: 1.45')
  })
})







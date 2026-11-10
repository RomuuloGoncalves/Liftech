import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')
const clean = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
const block = (css: string, selector: string) => {
  const found = [...clean(css).matchAll(/([^{}]+)\{([^}]*)\}/g)].find(([, s]) => s.replace(/\s+/g, ' ').trim() === selector)
  return found ? found[2].replace(/\s+/g, ' ').trim() : ''
}

describe('Header.module.css harmony layout (T11)', () => {
  const headerCss = read('src/components/layout/Header.module.css')

  it('languageOption uses --fs-md and 8px 10px padding', () => {
    const opt = block(headerCss, '.languageOption')
    expect(opt).toContain('font-size: var(--fs-md);')
    expect(opt).toContain('padding: 8px 10px;')
    expect(opt).not.toContain('var(--fs-sm)')
    expect(opt).not.toMatch(/padding:\s*8px;/)
  })

  it('button transitions use --dur-fast and --ease-out without fallback', () => {
    const btn = block(headerCss, '.iconButton, .avatarButton')
    expect(btn).toContain('transition: transform var(--dur-fast) var(--ease-out);')
    expect(headerCss).not.toContain('120ms ease')
  })

  it('popover animation uses --dur-base and --ease-out without fallback', () => {
    const pop = block(headerCss, '.popover')
    expect(pop).toContain('animation: popover-in var(--dur-base) var(--ease-out);')
    expect(headerCss).not.toContain('var(--ease-out,')
    expect(headerCss).not.toContain('cubic-bezier')
  })
})

describe('Sidebar.module.css harmony layout (T12)', () => {
  const sidebarCss = read('src/components/layout/Sidebar.module.css')

  it('sidebar desktop uses width var(--dur-slow) var(--ease-out)', () => {
    const sb = block(sidebarCss, '.sidebar')
    expect(sb).toContain('transition: width var(--dur-slow) var(--ease-out);')
    expect(sidebarCss).not.toContain('200ms var(--ease-out')
  })

  it('sidebar mobile uses transform var(--dur-slow) var(--ease-out)', () => {
    expect(sidebarCss).toContain('transition: transform var(--dur-slow) var(--ease-out);')
    expect(sidebarCss).not.toContain('220ms var(--ease-out')
  })

  it('toggleButton uses transform var(--dur-fast) var(--ease-out)', () => {
    const btn = block(sidebarCss, '.toggleButton')
    expect(btn).toContain('transition: transform var(--dur-fast) var(--ease-out);')
  })

  it('sectionLabel uses var(--text-label)', () => {
    const label = block(sidebarCss, '.sectionLabel')
    expect(label).toContain('color: var(--text-label);')
    expect(label).not.toContain('color: var(--text-h);')
  })

  it('feedbackButton uses font-weight: 600', () => {
    const fb = block(sidebarCss, '.feedbackButton')
    expect(fb).toContain('font-weight: 600;')
  })
})

describe('Sidebar.tsx inline style tokens (T13)', () => {
  const sidebarTsx = read('src/components/layout/Sidebar.tsx')

  it('DEV links use fontSize var(--fs-sm) instead of literal 12', () => {
    expect(sidebarTsx).toContain("fontSize: 'var(--fs-sm)'")
    expect(sidebarTsx).not.toContain('fontSize: 12')
  })
})

describe('AlertsDropdown.module.css harmony layout (T14)', () => {
  const alertsCss = read('src/components/layout/AlertsDropdown.module.css')

  it('bellButton transitions use --dur-fast and --ease-out', () => {
    const btn = block(alertsCss, '.bellButton')
    expect(btn).toContain('transition: transform var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);')
    expect(alertsCss).not.toContain('120ms ease')
  })

  it('popover animation uses --dur-base and --ease-out without fallback', () => {
    const pop = block(alertsCss, '.popover')
    expect(pop).toContain('animation: popover-in var(--dur-base) var(--ease-out);')
    expect(alertsCss).not.toContain('cubic-bezier')
  })

  it('titleButton uses --fs-base and --blue-text', () => {
    const tb = block(alertsCss, '.titleButton')
    expect(tb).toContain('font-size: var(--fs-base);')
    expect(tb).toContain('color: var(--blue-text);')
    expect(tb).not.toContain('var(--fs-sm)')
  })

  it('machineName uses --danger-text', () => {
    const mn = block(alertsCss, '.machineName')
    expect(mn).toContain('color: var(--danger-text);')
    expect(mn).not.toContain('var(--red)')
  })

  it('errorText uses --fs-sm, weight 500 and --danger-text', () => {
    const err = block(alertsCss, '.errorText')
    expect(err).toContain('font-size: var(--fs-sm);')
    expect(err).toContain('font-weight: 500;')
    expect(err).toContain('color: var(--danger-text);')
    expect(err).not.toContain('var(--red)')
    expect(err).not.toContain('var(--fs-xs)')
  })

  it('retryButton uses --fs-sm and weight 600', () => {
    const rb = block(alertsCss, '.retryButton')
    expect(rb).toContain('font-size: var(--fs-sm);')
    expect(rb).toContain('font-weight: 600;')
    expect(rb).not.toContain('var(--fs-xs)')
  })

  it('moreButton uses tabular-nums', () => {
    const mb = block(alertsCss, '.moreButton')
    expect(mb).toContain('font-variant-numeric: tabular-nums;')
  })
})

describe('BranchSelector.module.css harmony layout (T15)', () => {
  const branchCss = read('src/components/layout/BranchSelector.module.css')

  it('label uses var(--text-label)', () => {
    const lbl = block(branchCss, '.label')
    expect(lbl).toContain('color: var(--text-label);')
    expect(lbl).not.toContain('color: var(--text-h);')
  })

  it('actionBranch and actionBranchCreate use font-weight: 600 without bold', () => {
    const act = block(branchCss, '.actionBranch, .actionBranchCreate')
    expect(act).toContain('font-weight: 600;')
    expect(branchCss).not.toContain('font-weight: bold;')
  })

  it('alert uses --danger-text and weight 500', () => {
    const alt = block(branchCss, '.alert')
    expect(alt).toContain('color: var(--danger-text);')
    expect(alt).toContain('font-weight: 500;')
    expect(alt).not.toContain('var(--danger-solid)')
  })

  it('confirm uses --blue-text while edit stays blue and danger stays danger-solid', () => {
    expect(block(branchCss, '.confirm')).toContain('color: var(--blue-text);')
    expect(block(branchCss, '.edit')).toContain('color: var(--blue);')
    expect(block(branchCss, '.danger')).toContain('color: var(--danger-solid);')
  })
})

describe('ProfileModal.module.css harmony layout (T16)', () => {
  const profileCss = read('src/components/layout/ProfileModal.module.css')

  it('label uses --fs-md and weight 600', () => {
    const lbl = block(profileCss, '.label')
    expect(lbl).toContain('font-size: var(--fs-md);')
    expect(lbl).toContain('font-weight: 600;')
    expect(lbl).not.toContain('var(--fs-base)')
  })

  it('value uses --fs-md', () => {
    const val = block(profileCss, '.value')
    expect(val).toContain('font-size: var(--fs-md);')
    expect(val).not.toContain('var(--fs-base)')
  })

  it('deleteButton uses --fs-sm, weight 600 and --danger-text', () => {
    const db = block(profileCss, '.deleteButton')
    expect(db).toContain('font-size: var(--fs-sm);')
    expect(db).toContain('font-weight: 600;')
    expect(db).toContain('color: var(--danger-text);')
    expect(db).not.toContain('var(--fs-base)')
    expect(db).not.toContain('var(--danger-solid)')
  })

  it('editButton color and logoutButton opacity transitions use --dur-fast and --ease-out', () => {
    expect(block(profileCss, '.editButton')).toContain('transition: color var(--dur-fast) var(--ease-out);')
    expect(block(profileCss, '.logoutButton')).toContain('transition: opacity var(--dur-fast) var(--ease-out);')
    expect(profileCss).not.toContain('150ms ease')
  })
})






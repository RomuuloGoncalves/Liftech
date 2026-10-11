import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), `src/components/layout/${file}`), 'utf8')
const header = read('Header.module.css')
const sidebar = read('Sidebar.module.css')

const block = (css: string, selector: string) => {
  const m = css.match(new RegExp(`(?:^|(?<!,)\\n)${selector.replace('.', '\\.')}\\s*\\{([^}]*)\\}`))
  return m ? m[1] : ''
}
const hex = /#[0-9a-fA-F]{3,8}\b/
const colorRgba = /rgba?\(\s*(?!0\s*,\s*0\s*,\s*0\b)(?!255\s*,\s*255\s*,\s*255\b)/

describe('Header styles (RST-04, RST-05)', () => {
  it('uses page background and --line divider on .header', () => {
    const b = block(header, '.header')
    expect(b).toContain('background: var(--bg-page)')
    expect(b).toContain('border-bottom: 1px solid var(--line)')
  })

  it('keeps white surface on icon buttons and blue avatar with white text', () => {
    expect(block(header, '.iconButton,\n.avatarButton')).toContain('background: var(--bg)')
    const avatar = block(header, '.avatarButton')
    expect(avatar).toContain('background: var(--blue)')
    expect(avatar).toContain('color: var(--white)')
  })

  it('has no hex or colored rgba', () => {
    expect(header).not.toMatch(hex)
    expect(header).not.toMatch(colorRgba)
  })
})

describe('Sidebar styles (RST-04, RST-05)', () => {
  it('uses --sidebar-line right border and keeps --bg-sidebar', () => {
    const b = block(sidebar, '.sidebar')
    expect(b).toContain('border-right: 1px solid var(--sidebar-line)')
    expect(b).toContain('background: var(--bg-sidebar)')
  })

  it('uses --blue for the active item with white text', () => {
    const b = block(sidebar, '.navLink.active')
    expect(b).toContain('background: var(--blue)')
    expect(b).toContain('color: var(--white)')
  })

  it('has no hex or colored rgba', () => {
    expect(sidebar).not.toMatch(hex)
    expect(sidebar).not.toMatch(colorRgba)
  })
})

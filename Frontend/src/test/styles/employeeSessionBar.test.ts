import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) =>
  readFileSync(resolve(process.cwd(), `src/components/employee/${file}`), 'utf8')
const block = (css: string, selector: string) =>
  css.match(new RegExp(`(?:^|\\n)\\${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
const zIndex = (css: string, selector: string) => Number(block(css, selector).match(/z-index:\s*(\d+)/)?.[1])

describe('SessionBar styles', () => {
  const bar = block(read('SessionBar.module.css'), '.bar')

  it('is a 44px blue bar with white text and 12px radius', () => {
    expect(bar).toContain('height: 44px')
    expect(bar).toContain('background: var(--blue)')
    expect(bar).toContain('color: var(--white)')
    expect(bar).toContain('border-radius: 12px')
  })

  it('is fixed, centered and limited to 480px', () => {
    expect(bar).toContain('position: fixed')
    expect(bar).toContain('left: 50%')
    expect(bar).toContain('translateX(-50%)')
    expect(bar).toContain('max-width: 480px')
  })

  it('never exceeds the viewport width', () => {
    expect(bar).toContain('width: calc(100% - 32px)')
    expect(bar).not.toMatch(/[^-]width:\s*\d+px/)
  })

  it('sits above the content and below the sheet overlay', () => {
    const own = zIndex(read('SessionBar.module.css'), '.bar')
    expect(own).toBeGreaterThan(0)
    expect(own).toBeLessThan(zIndex(read('BottomSheet.module.css'), '.backdrop'))
  })

  it('truncates the machine name with an ellipsis', () => {
    const machine = block(read('SessionBar.module.css'), '.machine')
    expect(machine).toContain('text-overflow: ellipsis')
    expect(machine).toContain('min-width: 0')
  })

  it('layout reserves extra bottom space when the bar is shown', () => {
    expect(read('EmployeeLayout.module.css')).toMatch(/:has\(\[data-session-bar\]\)[^{]*\{[^}]*padding-bottom:/)
  })
})

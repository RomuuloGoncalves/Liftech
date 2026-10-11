import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(resolve(process.cwd(), 'src/pages/employee/EmployeeSessionPage.module.css'), 'utf8')
const rule = (selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, s]) => s.trim() === selector)
    .map(([, , body]) => body.replace(/\s+/g, ' '))
    .join(' ')

describe('employee session styles (EMP-08)', () => {
  it('buttons are 40px tall with 8px radius', () => {
    expect(rule('.button')).toContain('height: 40px;')
    expect(rule('.button')).toContain('border-radius: 8px;')
  })

  it('timer is 48px / 700 with tabular numbers', () => {
    const timer = rule('.timer')
    expect(timer).toContain('font-size: 48px;')
    expect(timer).toContain('font-weight: 700;')
    expect(timer).toContain('tabular-nums')
  })

  it('column is at most 480px and centered', () => {
    expect(rule('.page')).toContain('max-width: 480px;')
    expect(rule('.page')).toContain('margin: 0 auto;')
  })
})

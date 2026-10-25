import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'vitest'
import { expectSharedShell } from './shell'

const css = readFileSync(
  resolve(process.cwd(), 'src/pages/employee/EmployeeSettingsPage.module.css'),
  'utf8',
)

describe('EmployeeSettings card styles (CARD-09)', () => {
  it('.card uses the shared cardLg shell', () => {
    expectSharedShell(css, '.card', 'cardLg')
  })
})

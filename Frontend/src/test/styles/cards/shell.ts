import { expect } from 'vitest'

export function expectSharedShell(
  css: string,
  selector: string,
  variant: 'card' | 'cardLg' = 'card',
) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = clean.match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))
  if (!match) {
    throw new Error(`Selector "${selector}" not found in CSS`)
  }
  const body = match[1]

  const composesRegex = new RegExp(
    `composes:\\s*${variant}(?![\\w-])(?:\\s+from\\s+['"][^'"]*Card\\.module\\.css['"])?;?`,
  )
  expect(body).toMatch(composesRegex)

  expect(body).not.toMatch(/(?<![-\w])padding(?:-[a-z]+)?\s*:/)
  expect(body).not.toMatch(/(?<![-\w])border(?:-[a-z]+)?\s*:/)
  expect(body).not.toMatch(/(?<![-\w])background(?:-[a-z]+)?\s*:/)
}

import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = resolve(process.cwd(), 'src/components/machines')
const read = (file: string) => readFileSync(resolve(dir, file), 'utf8')
const block = (css: string, cls: string) => {
  const m = css.match(new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`))
  if (!m) throw new Error(`.${cls} not found`)
  return m[1].replace(/\s+/g, ' ')
}

const card = read('MachineCard.module.css')
const modal = read('MachineDetailModal.module.css')

describe('Machine status badges (RST-06)', () => {
  it.each([
    ['statusAvailable', 'green-bg', 'green'],
    ['statusInUse', 'blue-bg', 'blue'],
    ['statusMaintenance', 'yellow-bg', 'yellow'],
  ])('MachineCard .%s uses --%s with --%s text', (cls, bg, fg) => {
    const b = block(card, cls)
    expect(b).toContain(`background: var(--${bg})`)
    expect(b).toContain(`color: var(--${fg})`)
  })

  it('MachineCard .statusOffline stays neutral grey', () => {
    const b = block(card, 'statusOffline')
    expect(b).toContain('background: var(--gray-bg)')
    expect(b).toContain('color: var(--black-text)')
    expect(b).toContain('border-color: var(--gray-border)')
  })

  it.each([
    ['statusAvailable', 'green-bg', 'green'],
    ['statusInUse', 'blue-bg', 'blue'],
    ['statusMaintenance', 'yellow-bg', 'yellow'],
  ])('MachineDetailModal .%s uses --%s with --%s text', (cls, bg, fg) => {
    const b = block(modal, cls)
    expect(b).toContain(`background: var(--${bg})`)
    expect(b).toContain(`color: var(--${fg})`)
  })
})

describe('Machine detail buttons (RST-08)', () => {
  it('Editar is --blue, Excluir is --danger-solid, both with --white text', () => {
    expect(block(modal, 'edit')).toContain('background: var(--blue)')
    expect(block(modal, 'delete')).toContain('background: var(--danger-solid)')
    expect(block(modal, 'action')).toContain('color: var(--white)')
  })
})

describe('components/machines CSS has no raw colours', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.module.css'))

  it.each(files)('%s has no #hex and no coloured rgba()', (file) => {
    const css = read(file)
    expect(css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([])
    const coloured = (css.match(/rgba?\([^)]*\)/g) ?? []).filter((c) => !/^rgba?\(\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]/.test(c))
    expect(coloured).toEqual([])
  })
})

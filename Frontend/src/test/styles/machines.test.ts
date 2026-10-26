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

const badge = read('StatusBadge.module.css')
const modal = read('MachineDetailModal.module.css')

describe('Machine status badges (RST-06)', () => {
  it.each([
    ['disponivel', 'green-bg', 'green'],
    ['em_uso', 'blue-bg', 'blue'],
    ['manutencao', 'yellow-bg', 'yellow'],
  ])('StatusBadge .%s uses --%s with --%s text', (cls, bg, fg) => {
    const b = block(badge, cls)
    expect(b).toContain(`background: var(--${bg})`)
    expect(b).toContain(`color: var(--${fg})`)
  })

  it('StatusBadge .offline stays neutral grey', () => {
    const b = block(badge, 'offline')
    expect(b).toContain('background: var(--gray-bg)')
    expect(b).toContain('color: var(--black-text)')
    expect(b).toContain('border-color: var(--gray-border)')
  })

  it.each([
    ['toneDisponivel', 'green', 'white'],
    ['toneEmUso', 'blue', 'white'],
    ['toneAlerta', 'danger-solid', 'white'],
  ])('StatusBadge header tone .%s is solid --%s with --%s text', (cls, bg, fg) => {
    const b = block(badge, cls)
    expect(b).toContain(`background: var(--${bg})`)
    expect(b).toContain(`color: var(--${fg})`)
  })

  it('StatusBadge .alerta is red, distinct from offline', () => {
    const b = block(badge, 'alerta')
    expect(b).toContain('color: var(--danger-solid)')
    expect(b).toContain('background: var(--red-bg)')
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

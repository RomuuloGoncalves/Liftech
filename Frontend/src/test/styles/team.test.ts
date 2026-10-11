import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = resolve(process.cwd(), 'src/components/team')
const read = (file: string) => readFileSync(resolve(dir, file), 'utf8')
const block = (css: string, selector: string) => {
  const m = css.match(new RegExp(`(?:^|\\n)\\${selector}\\s*\\{([^}]*)\\}`))
  return m ? m[1] : ''
}
const files = readdirSync(dir).filter((f) => f.endsWith('.css'))

describe('Equipe buttons and cards (RST-08, RST-11)', () => {
  const sector = read('SectorCard.module.css')
  const employee = read('EmployeeCard.module.css')

  it('SectorCard delete is a filled --danger-solid square with a white icon', () => {
    const b = block(sector, '.delete')
    expect(b).toMatch(/background:\s*var\(--danger-solid\)/)
    expect(block(sector, '.iconButton')).toMatch(/color:\s*var\(--white\)/)
  })

  it('SectorCard edit is a filled --blue square with a white icon', () => {
    const b = block(sector, '.edit')
    expect(b).toMatch(/background:\s*var\(--blue\)/)
    expect(block(sector, '.iconButton')).toMatch(/color:\s*var\(--white\)/)
  })

  it('SectorCard action buttons are ~25px squares', () => {
    const b = block(sector, '.iconButton')
    expect(b).toMatch(/width:\s*25px/)
    expect(b).toMatch(/height:\s*25px/)
  })

  it('EmployeeCard icons, access text and toggle use the tokens', () => {
    expect(block(employee, '.delete')).toMatch(/color:\s*var\(--danger-solid\)/)
    expect(block(employee, '.edit')).toMatch(/color:\s*var\(--blue\)/)
    expect(block(employee, '.allowed')).toMatch(/color:\s*var\(--blue\)/)
    expect(block(employee, '.denied')).toMatch(/color:\s*var\(--red\)/)
    expect(block(employee, '.switchOn')).toMatch(/background:\s*var\(--blue\)/)
  })

  it('neither card keeps the icon box CSS', () => {
    expect(sector).not.toMatch(/^\.icon\s*\{/m)
    expect(employee).not.toMatch(/^\.avatar\s*\{/m)
  })

  it.each(files)('%s has no hex colour and no coloured rgba', (file) => {
    const css = read(file)
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const coloured = [...css.matchAll(/rgba?\(([^)]*)\)/g)].filter(
      ([, args]) => !/^\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]?/.test(args + ')')
    )
    expect(coloured).toEqual([])
  })
})

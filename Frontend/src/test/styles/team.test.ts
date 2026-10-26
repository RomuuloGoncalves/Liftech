import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dir = resolve(process.cwd(), 'src/components/team')
const read = (file: string) => readFileSync(resolve(dir, file), 'utf8')
const files = readdirSync(dir).filter((f) => f.endsWith('.css') && !f.endsWith('Card.module.css'))

describe('Equipe forms and components (RST-08, RST-11)', () => {
  it.each(files)('%s has no hex colour and no coloured rgba', (file) => {
    const css = read(file)
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    const coloured = [...css.matchAll(/rgba?\(([^)]*)\)/g)].filter(
      ([, args]) => !/^\s*(0\s*,\s*0\s*,\s*0|255\s*,\s*255\s*,\s*255)\s*[,)]?/.test(args + ')'),
    )
    expect(coloured).toEqual([])
  })
})

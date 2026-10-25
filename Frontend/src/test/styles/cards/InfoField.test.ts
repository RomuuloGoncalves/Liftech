import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  resolve(process.cwd(), 'src/components/common/InfoField.module.css'),
  'utf8',
)
const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
const block = (selector: string) =>
  [...cleanCss.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('InfoField.module.css styles (CARD-02)', () => {
  it('.label matches typography and color specs', () => {
    const labelBlock = block('.label')
    expect(labelBlock).toMatch(/font-size:\s*var\(--fs-md\);/)
    expect(labelBlock).toMatch(/font-weight:\s*600;/)
    expect(labelBlock).toMatch(/color:\s*var\(--text-h\);/)
    expect(labelBlock).toMatch(/line-height:\s*calc\(17\s*\*\s*var\(--px,\s*1px\)\);/)
  })

  it('.value matches typography, truncation, and tabular-nums specs', () => {
    const valueBlock = block('.value')
    expect(valueBlock).toMatch(/font-size:\s*var\(--fs-md\);/)
    expect(valueBlock).toMatch(/font-weight:\s*400;/)
    expect(valueBlock).toMatch(/color:\s*var\(--text\);/)
    expect(valueBlock).toMatch(/line-height:\s*calc\(17\s*\*\s*var\(--px,\s*1px\)\);/)
    expect(valueBlock).toMatch(/text-overflow:\s*ellipsis;/)
    expect(valueBlock).toMatch(/white-space:\s*nowrap;/)
    expect(valueBlock).toMatch(/font-variant-numeric:\s*tabular-nums;/)
  })

  it('.highlight .label matches highlight typography and color specs', () => {
    const highlightBlock = block('.highlight .label')
    expect(highlightBlock).toMatch(/font-size:\s*var\(--fs-lg\);/)
    expect(highlightBlock).toMatch(/font-weight:\s*700;/)
    expect(highlightBlock).toMatch(/color:\s*var\(--text-h\);/)
    expect(highlightBlock).toMatch(/line-height:\s*calc\(22\s*\*\s*var\(--px,\s*1px\)\);/)
  })

  it('does not force .highlight .value to overflow visible or highlight typography', () => {
    const highlightValueBlock = block('.highlight .value')
    expect(highlightValueBlock).not.toMatch(/overflow:\s*visible;/)
    expect(highlightValueBlock).not.toMatch(/font-size:\s*var\(--fs-lg\);/)
    expect(highlightValueBlock).not.toMatch(/font-weight:\s*700;/)
  })

  it('.inline aligns items in a row baseline with 4px gap', () => {
    const inlineBlock = block('.inline')
    expect(inlineBlock).toMatch(/flex-direction:\s*row;/)
    expect(inlineBlock).toMatch(/align-items:\s*baseline;/)
    expect(inlineBlock).toMatch(/gap:\s*4px;/)
  })
})

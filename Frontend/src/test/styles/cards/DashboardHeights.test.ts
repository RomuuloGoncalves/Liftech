import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dashboardCss = readFileSync(
  resolve(process.cwd(), 'src/pages/DashboardPage.module.css'),
  'utf8',
)

const machineTableCss = readFileSync(
  resolve(process.cwd(), 'src/components/dashboard/MachineTable.module.css'),
  'utf8',
)

const usageHeatmapCss = readFileSync(
  resolve(process.cwd(), 'src/components/dashboard/UsageHeatmap.module.css'),
  'utf8',
)

const clean = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const extractBlock = (source: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = clean(source).match(new RegExp(`(?:^|\\})\\s*${escaped}\\s*\\{([^}]*)\\}`))
  return (m?.[1] ?? '').replace(/\s+/g, ' ').trim()
}

const extractMediaBlocks = (source: string, query: string) => {
  const regex = new RegExp(`@media\\s*\\(${query}\\)\\s*\\{([\\s\\S]*?\\})\\s*\\}`, 'g')
  return [...clean(source).matchAll(regex)].map((m) => m[1]).join('\n')
}

describe('Dashboard cards height equalization (DashboardHeights)', () => {
  describe('DashboardPage .infoGrid layout', () => {
    it('uses align-items: stretch so side-by-side cards equal heights', () => {
      const block = extractBlock(dashboardCss, '.infoGrid')
      expect(block).toContain('align-items: stretch;')
    })

    it('defines 1.9fr 1.1fr desktop grid columns with 24px gap', () => {
      const block = extractBlock(dashboardCss, '.infoGrid')
      expect(block).toContain('display: grid;')
      expect(block).toContain('grid-template-columns: 1.9fr 1.1fr;')
      expect(block).toContain('gap: 24px;')
    })

    it('switches .infoGrid to 1 column below 1100px', () => {
      const mediaContent = extractMediaBlocks(dashboardCss, 'max-width: 1100px')
      expect(mediaContent).toMatch(/\.infoGrid\s*\{[^}]*grid-template-columns:\s*1fr;/)
    })
  })

  describe('MachineTable card containment and scrolling', () => {
    it('constrains .container with min-height: 0 and overflow: hidden', () => {
      const block = extractBlock(machineTableCss, '.container')
      expect(block).toContain('min-height: 0;')
      expect(block).toContain('overflow: hidden;')
      expect(block).toContain('display: flex;')
      expect(block).toContain('flex-direction: column;')
    })

    it('configures .tableWrapper with flex: 1, overflow-y: auto and compatible max-height (~240px)', () => {
      const block = extractBlock(machineTableCss, '.tableWrapper')
      expect(block).toContain('flex: 1;')
      expect(block).toContain('overflow-y: auto;')
      expect(block).toContain('overflow-x: auto;')
      expect(block).toContain('min-height: 0;')
      expect(block).toMatch(/max-height:\s*240px;/)
    })

    it('ensures topBar and footer remain visible and do not shrink', () => {
      const topBarBlock = extractBlock(machineTableCss, '.topBar')
      expect(topBarBlock).toContain('flex-shrink: 0;')

      const footerBlock = extractBlock(machineTableCss, '.footer')
      expect(footerBlock).toContain('flex-shrink: 0;')
      expect(footerBlock).toContain('margin-top: auto;')
    })

    it('does not force table height below 1100px (1 column)', () => {
      const mediaContent = extractMediaBlocks(machineTableCss, 'max-width: 1100px')
      expect(mediaContent).toMatch(/\.tableWrapper\s*\{[^}]*max-height:\s*none;/)
      expect(mediaContent).toMatch(/\.tableWrapper\s*\{[^}]*overflow-y:\s*visible;/)
    })
  })

  describe('UsageHeatmap reference card', () => {
    it('defines flex container with standard padding and border for ~405px natural height', () => {
      const block = extractBlock(usageHeatmapCss, '.container')
      expect(block).toContain('display: flex;')
      expect(block).toContain('flex-direction: column;')
      expect(block).toContain('padding: 24px;')
      expect(block).toContain('box-sizing: border-box;')
    })
  })
})

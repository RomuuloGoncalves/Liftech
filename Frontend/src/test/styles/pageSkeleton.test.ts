import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src', file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''
const px = (css: string, prop: string) => Number(css.match(new RegExp(`(?:^|[\\s;])${prop}:\\s*(\\d+)px`))?.[1])

const skeleton = read('components/common/PageSkeleton.module.css')
const machineCard = read('components/machines/MachineCard.module.css')
const fleetCard = read('components/fleet/FleetCard.module.css')
const overview = read('pages/VisaoGeralPage.module.css')
const alerts = read('pages/AlertasPage.module.css')
const fleetRow = read('components/fleet/FleetRow.module.css')
const fleetPage = read('pages/FrotaPage.module.css')
const employeeCard = read('components/team/EmployeeCard.module.css')
const sectorCard = read('components/team/SectorCard.module.css')
const team = read('pages/EquipePage.module.css')
// Valor em `calc(N * var(--px, 1px))`: devolve N.
const scaled = (css: string, prop: string) => Number(css.match(new RegExp(`(?:^|[\\s;])${prop}:\\s*calc\\((\\d+) \\* var\\(--px, 1px\\)\\)`))?.[1])

describe('PageSkeleton styles', () => {
  it('is a transparent shell so the toolbar and grid sit in the page layout', () => {
    expect(block(skeleton, '.wrapper')).toMatch(/display:\s*contents/)
  })

  it('machine card uses the MachineCard box: 12px padding, 1px border, 8px gap and radius', () => {
    const card = block(skeleton, '.machine')
    const real = block(machineCard, '.card')
    expect(card).toMatch(/padding:\s*12px/)
    expect(card).toMatch(/border:\s*1px solid var\(--border\)/)
    expect(card).toMatch(/border-radius:\s*var\(--radius-md\)/)
    expect(card).toMatch(/gap:\s*8px/)
    for (const rule of ['padding', 'border', 'border-radius', 'gap']) {
      expect(card.match(new RegExp(`${rule}:\\s*([^;]+)`))![1]).toBe(real.match(new RegExp(`${rule}:\\s*([^;]+)`))![1])
    }
  })

  it('machine card is 155px tall: 36px names, 39px details and 38px footer between 8px gaps', () => {
    const names = px(block(skeleton, '.machineName'), 'height') + px(block(skeleton, '.machineNames'), 'gap') + px(block(skeleton, '.machineId'), 'height')
    const total = names + px(block(skeleton, '.machineDetails'), 'height') + px(block(skeleton, '.machineFooter'), 'height')
    expect(names).toBe(36)
    expect(px(block(skeleton, '.machineDetails'), 'height')).toBe(39)
    expect(px(block(skeleton, '.machineFooter'), 'height')).toBe(38)
    expect(total + 2 * 8 + 2 * 12 + 2 * 1).toBe(155)
  })
})

describe('VisaoGeralPage skeleton toolbar styles', () => {
  it('search placeholder is 300px wide (shrinking to 160px) and 32px tall, like the real search', () => {
    const search = block(overview, '.searchSkeleton')
    expect(search).toMatch(/flex:\s*0 1 300px/)
    expect(search).toMatch(/min-width:\s*160px/)
    expect(search).toMatch(/height:\s*32px/)
    expect(block(overview, '.searchField')).toMatch(/flex:\s*0 1 300px/)
    expect(block(overview, '.searchInput')).toMatch(/height:\s*32px/)
  })

  it('select and button placeholders are 32px tall and do not shrink, like the real controls', () => {
    const controls = block(overview, '.selectSkeleton,\n.buttonSkeleton')
    expect(controls).toMatch(/height:\s*32px/)
    expect(controls).toMatch(/flex-shrink:\s*0/)
    expect(block(overview, '.statusSelect')).toMatch(/height:\s*32px/)
    expect(block(overview, '.registerButton')).toMatch(/height:\s*32px/)
  })
})

describe('PageSkeleton fleet card styles', () => {
  const card = block(skeleton, '.fleet')

  it('is as wide as FleetCard: 288 * var(--px), with the same box', () => {
    expect(card).toMatch(/flex:\s*0 0 calc\(288 \* var\(--px, 1px\)\)/)
    expect(block(fleetCard, '.card')).toMatch(/flex:\s*0 0 calc\(288 \* var\(--px, 1px\)\)/)
    expect(card).toMatch(/border:\s*1px solid var\(--line\)/)
    expect(card).toMatch(/border-radius:\s*calc\(8 \* var\(--px, 1px\)\)/)
    expect(scaled(card, 'padding')).toBe(12)
  })

  it('is 170 * var(--px) tall: 47 strip, 8 gap, 3 groups of 31 with 4 between, 12 padding, 1px borders', () => {
    const group = scaled(block(skeleton, '.fleetLabel'), 'height') + scaled(block(skeleton, '.fleetGroup'), 'gap') + scaled(block(skeleton, '.fleetValue'), 'height')
    const body = 3 * group + 2 * scaled(block(skeleton, '.fleetBody'), 'gap')
    expect(scaled(block(skeleton, '.fleetStrip'), 'height')).toBe(47)
    expect(group).toBe(31)
    expect(body).toBe(101)
    expect(1 + 47 + scaled(card, 'gap') + body + scaled(card, 'padding') + 1).toBe(170)
  })

  it('strip bleeds over the card padding like the FleetCard header', () => {
    expect(block(skeleton, '.fleetStrip')).toMatch(/margin:\s*calc\(-12 \* var\(--px, 1px\)\) calc\(-12 \* var\(--px, 1px\)\) 0/)
    expect(block(fleetCard, '.topRow.danger,\n.topRow.warning,\n.topRow.caution')).toMatch(
      /margin:\s*calc\(-12 \* var\(--px, 1px\)\) calc\(-12 \* var\(--px, 1px\)\) 0/
    )
  })
})

describe('AlertasPage skeleton toolbar styles', () => {
  it('label is 24px tall, search 260x32 and period 32px tall, like the real toolbar', () => {
    expect(block(alerts, '.labelSkeleton')).toMatch(/height:\s*24px/)
    expect(block(alerts, '.searchSkeleton')).toMatch(/width:\s*260px/)
    expect(block(alerts, '.searchSkeleton')).toMatch(/height:\s*32px/)
    expect(block(alerts, '.periodSkeleton')).toMatch(/height:\s*32px/)
    expect(block(alerts, '.searchInput')).toMatch(/width:\s*260px/)
    expect(block(alerts, '.period')).toMatch(/height:\s*32px/)
  })

  it('search placeholder fills the row on narrow screens, like the real search', () => {
    expect(alerts).toMatch(/@media \(max-width: 767px\)[\s\S]*\.searchSkeleton/)
  })
})

describe('PageSkeleton kanban panel styles', () => {
  const panel = block(skeleton, '.panel')

  it('mirrors the FleetRow box: padding 12/20/20, gap 12 and radius 8, all in --px, 1px line border', () => {
    expect(panel).toMatch(/padding:\s*calc\(12 \* var\(--px, 1px\)\) calc\(20 \* var\(--px, 1px\)\) calc\(20 \* var\(--px, 1px\)\)/)
    expect(panel).toMatch(/gap:\s*calc\(12 \* var\(--px, 1px\)\)/)
    expect(panel).toMatch(/border:\s*1px solid var\(--line\)/)
    expect(panel).toMatch(/border-radius:\s*calc\(8 \* var\(--px, 1px\)\)/)
    for (const rule of ['padding', 'gap', 'border', 'border-radius']) {
      expect(panel.match(new RegExp(`${rule}:\\s*([^;]+)`))![1]).toBe(block(fleetRow, '.row').match(new RegExp(`${rule}:\\s*([^;]+)`))![1])
    }
  })

  it('header has the 158x24 label, a 240x24 search and a 240x27 period, in --px', () => {
    expect(block(skeleton, '.label')).toMatch(/width:\s*calc\(158 \* var\(--px, 1px\)\)/)
    expect(block(skeleton, '.label')).toMatch(/height:\s*calc\(24 \* var\(--px, 1px\)\)/)
    expect(scaled(block(skeleton, '.panelSearch'), 'width')).toBe(240)
    expect(scaled(block(skeleton, '.panelSearch'), 'height')).toBe(24)
    expect(scaled(block(skeleton, '.panelPeriod'), 'width')).toBe(240)
    expect(scaled(block(skeleton, '.panelPeriod'), 'height')).toBe(27)
    expect(scaled(block(fleetRow, '.search'), 'width')).toBe(240)
    expect(scaled(block(fleetRow, '.search'), 'height')).toBe(24)
    expect(scaled(block(skeleton, '.panelTools'), 'gap')).toBe(scaled(block(fleetRow, '.tools'), 'gap'))
  })

  it('card row keeps the FleetRow gap of 10 and 4 of bottom padding', () => {
    expect(scaled(block(skeleton, '.kanbanCards'), 'gap')).toBe(scaled(block(fleetRow, '.cards'), 'gap'))
    expect(scaled(block(skeleton, '.kanbanCards'), 'padding-bottom')).toBe(scaled(block(fleetRow, '.cards'), 'padding-bottom'))
  })
})

describe('FrotaPage skeleton toolbar styles', () => {
  it('search 300x32, select 142 and button 175 wide, all 32px tall and not shrinking', () => {
    expect(block(fleetPage, '.searchSkeleton')).toMatch(/width:\s*300px/)
    expect(block(fleetPage, '.search')).toMatch(/width:\s*300px/)
    const controls = block(fleetPage, '.searchSkeleton,\n.selectSkeleton,\n.buttonSkeleton')
    expect(controls).toMatch(/height:\s*32px/)
    expect(controls).toMatch(/flex-shrink:\s*0/)
    expect(block(fleetPage, '.selectSkeleton')).toMatch(/width:\s*142px/)
    expect(block(fleetPage, '.buttonSkeleton')).toMatch(/width:\s*175px/)
    expect(block(fleetPage, '.filter')).toMatch(/height:\s*32px/)
    expect(block(fleetPage, '.createButton')).toMatch(/height:\s*32px/)
  })
})

describe('PageSkeleton team card styles', () => {
  const employee = block(skeleton, '.employee')
  const sector = block(skeleton, '.sector')

  it('employee card has the EmployeeCard box: 12px padding, 0.5px border, radius md', () => {
    for (const rule of ['padding', 'border', 'border-radius', 'gap']) {
      expect(employee.match(new RegExp(`${rule}:\\s*([^;]+)`))![1]).toBe(block(employeeCard, '.card').match(new RegExp(`${rule}:\\s*([^;]+)`))![1])
    }
    expect(employee).toMatch(/border:\s*0\.5px solid var\(--border\)/)
  })

  it('employee card is 81px tall: 55px info + 24px padding + 2px borders', () => {
    expect(px(block(skeleton, '.employeeInfo'), 'height')).toBe(55)
    expect(55 + 2 * 12 + 2).toBe(81)
  })

  it('employee info, icons and switch have the real sizes (icons 16, switch 34x18)', () => {
    expect(block(skeleton, '.employeeSwitch')).toMatch(/width:\s*34px/)
    expect(block(skeleton, '.employeeSwitch')).toMatch(/height:\s*18px/)
    expect(block(employeeCard, '.switch')).toMatch(/width:\s*34px/)
    expect(block(employeeCard, '.switch')).toMatch(/height:\s*18px/)
    expect(block(skeleton, '.employeeIcon')).toMatch(/width:\s*16px/)
    expect(block(skeleton, '.employeeIcon')).toMatch(/height:\s*16px/)
  })

  it('sector card has the SectorCard box and two 25px buttons, so it is one 51px row', () => {
    for (const rule of ['padding', 'border', 'border-radius', 'gap', 'align-items']) {
      expect(sector.match(new RegExp(`${rule}:\\s*([^;]+)`))![1]).toBe(block(sectorCard, '.card').match(new RegExp(`${rule}:\\s*([^;]+)`))![1])
    }
    expect(block(skeleton, '.sectorButton')).toMatch(/width:\s*25px/)
    expect(block(skeleton, '.sectorButton')).toMatch(/height:\s*25px/)
    expect(block(sectorCard, '.iconButton')).toMatch(/width:\s*25px/)
    expect(25 + 2 * 12 + 2).toBe(51)
  })

  it('old card classes are gone', () => {
    for (const selector of ['.head', '.icon', '.lines', '.compact', '.card']) expect(block(skeleton, selector)).toBe('')
  })
})

describe('EquipePage skeleton toolbar styles', () => {
  it('title, register button, search and access select have the real widths and 32px height', () => {
    expect(block(team, '.titleSkeleton')).toMatch(/width:\s*103px/)
    expect(block(team, '.titleSkeleton')).toMatch(/height:\s*21px/)
    expect(block(team, '.employeeButtonSkeleton')).toMatch(/width:\s*195px/)
    expect(block(team, '.sectorButtonSkeleton')).toMatch(/width:\s*154px/)
    expect(block(team, '.searchSkeleton')).toMatch(/width:\s*240px/)
    expect(block(team, '.selectSkeleton')).toMatch(/width:\s*103px/)
    expect(block(team, '.searchField')).toMatch(/width:\s*240px/)
    const controls = block(team, '.employeeButtonSkeleton,\n.sectorButtonSkeleton,\n.searchSkeleton,\n.selectSkeleton')
    expect(controls).toMatch(/height:\s*32px/)
    expect(block(team, '.registerButton,\n.searchInput,\n.select')).toMatch(/height:\s*32px/)
  })

  it('search placeholder fills the row on narrow screens, like the real search', () => {
    expect(team).toMatch(/@media \(max-width: 768px\)[\s\S]*\.searchSkeleton/)
  })
})

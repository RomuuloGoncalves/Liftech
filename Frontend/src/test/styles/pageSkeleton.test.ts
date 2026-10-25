import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { expectSharedShell } from './cards/shell'

const read = (file: string) => readFileSync(resolve(process.cwd(), 'src', file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''
const px = (css: string, prop: string) => Number(css.match(new RegExp(`(?:^|[\\s;])${prop}:\\s*(\\d+)px`))?.[1])

const cardShell = read('components/common/Card.module.css')
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

  it('machine card uses the shared card shell, matching MachineCard', () => {
    expectSharedShell(skeleton, '.machine', 'card')
    expectSharedShell(machineCard, '.card', 'card')
  })

  it('machine card is 189px tall: 36px names, 72px details and 39px footer between 8px gaps', () => {
    const names = px(block(skeleton, '.machineName'), 'height') + px(block(skeleton, '.machineNames'), 'gap') + px(block(skeleton, '.machineId'), 'height')
    const details = px(block(skeleton, '.machineDetails'), 'height')
    const footer = px(block(skeleton, '.machineFooter'), 'height')
    const shellGap = scaled(block(cardShell, '.card'), 'gap')
    const shellPadding = scaled(block(cardShell, '.card'), 'padding')
    const border = 1 // 1px solid var(--card-border)

    // Nomes (36px): machineName (17px) + machineNames gap (6px) + machineId (13px)
    expect(names).toBe(36)
    // Detalhes recalculados a partir do CSS real (72px):
    // 2 InfoFields empilhados (setor e MAC); cada InfoField tem rótulo (17px) + valor (17px) = 34px.
    // Com 4px de gap em .details: 2 * (17 + 17) + 4 = 72px
    expect(details).toBe(72)
    // Rodapé recalculado a partir do CSS real (39px):
    // InfoField highlight de sessão tem rótulo em destaque (22px) + valor (17px) = 39px.
    // StatusBadge mede 22px; a linha alinhada pelo item mais alto mede 39px
    expect(footer).toBe(39)

    // Altura total da caixa do MachineCard recalculada (189px):
    // 36px nomes + 72px detalhes + 39px rodapé + 2 * 8px gaps da casca + 2 * 12px padding da casca + 2 * 1px bordas = 189px
    const total = names + details + footer + 2 * shellGap + 2 * shellPadding + 2 * border
    expect(total).toBe(189)
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

  it('is as wide as FleetCard: 288 * var(--px), with the shared card shell', () => {
    expectSharedShell(skeleton, '.fleet', 'card')
    expectSharedShell(fleetCard, '.card', 'card')
    expect(card).toMatch(/flex:\s*0 0 calc\(288 \* var\(--px, 1px\)\)/)
    expect(block(fleetCard, '.card')).toMatch(/flex:\s*0 0 calc\(288 \* var\(--px, 1px\)\)/)
  })

  it('is 170 * var(--px) tall: 47 strip, 8 gap, 3 groups of 31 with 4 between, 12 padding, 1px borders', () => {
    const group = scaled(block(skeleton, '.fleetLabel'), 'height') + scaled(block(skeleton, '.fleetGroup'), 'gap') + scaled(block(skeleton, '.fleetValue'), 'height')
    const body = 3 * group + 2 * scaled(block(skeleton, '.fleetBody'), 'gap')
    const shellGap = scaled(block(cardShell, '.card'), 'gap')
    const shellPadding = scaled(block(cardShell, '.card'), 'padding')
    expect(scaled(block(skeleton, '.fleetStrip'), 'height')).toBe(47)
    expect(group).toBe(31)
    expect(body).toBe(101)
    // Caixa da frota mantida em 170 * var(--px, 1px):
    // 1px borda sup + 47px faixa + 8px gap da casca + 101px corpo + 12px padding inf da casca + 1px borda inf = 170
    expect(1 + 47 + shellGap + body + shellPadding + 1).toBe(170)
  })

  it('strip bleeds over the card padding like the FleetCard header', () => {
    expect(block(skeleton, '.fleetStrip')).toMatch(/margin:\s*calc\(-12 \* var\(--px, 1px\)\) calc\(-12 \* var\(--px, 1px\)\) 0/)
    expect(block(fleetCard, '.topRow')).toMatch(
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

  it('employee card has the EmployeeCard box: shared shell with row variant', () => {
    expectSharedShell(skeleton, '.employee', 'card')
    expectSharedShell(employeeCard, '.card', 'card')
    expect(employee).toMatch(/composes:\s*card\s+row\b/)
    expect(block(employeeCard, '.card')).toMatch(/composes:\s*card\s+row\b/)
    for (const rule of ['align-items', 'justify-content']) {
      expect(employee.match(new RegExp(`${rule}:\\s*([^;]+)`))![1]).toBe(block(employeeCard, '.card').match(new RegExp(`${rule}:\\s*([^;]+)`))![1])
    }
    expect(employee).not.toContain('0.5px')
  })

  it('employee card is 81px tall: 55px info + 24px padding + 2px borders', () => {
    expect(px(block(skeleton, '.employeeInfo'), 'height')).toBe(55)
    const shellPadding = scaled(block(cardShell, '.card'), 'padding')
    const border = 1 // 1px solid var(--card-border)
    // Caixa do EmployeeCard: 55px info + 2 * 12px padding da casca + 2 * 1px bordas = 81px
    expect(55 + 2 * shellPadding + 2 * border).toBe(81)
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
    expectSharedShell(skeleton, '.sector', 'card')
    expectSharedShell(sectorCard, '.card', 'card')
    expect(sector).toMatch(/composes:\s*card\s+row\b/)
    expect(block(sectorCard, '.card')).toMatch(/composes:\s*card\s+row\b/)
    for (const rule of ['align-items', 'justify-content']) {
      expect(sector.match(new RegExp(`${rule}:\\s*([^;]+)`))![1]).toBe(block(sectorCard, '.card').match(new RegExp(`${rule}:\\s*([^;]+)`))![1])
    }
    expect(block(skeleton, '.sectorButton')).toMatch(/width:\s*25px/)
    expect(block(skeleton, '.sectorButton')).toMatch(/height:\s*25px/)
    expect(block(sectorCard, '.iconButton')).toMatch(/width:\s*25px/)
    const shellPadding = scaled(block(cardShell, '.card'), 'padding')
    const border = 1 // 1px solid var(--card-border)
    // Caixa do SectorCard: 25px botões + 2 * 12px padding da casca + 2 * 1px bordas = 51px
    expect(25 + 2 * shellPadding + 2 * border).toBe(51)
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

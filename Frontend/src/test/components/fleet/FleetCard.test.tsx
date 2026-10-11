import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FleetCard from '../../../components/fleet/FleetCard'
import type { CategoryKind } from '../../../data/fleet'
import type { Machine } from '../../../data/machines'

const machine: Machine = {
  id: '4',
  identificacao: 'EMP-084',
  nome: 'Empilhadeira Elétrica Titan-X',
  setor: 'Expedição - Bloco B',
  dispositivoConectado: { enderecoMac: 'A:2C:99:B1:DF:7', status: 'Disponível' },
  operadorConectado: { nome: 'Alexandre Mattos' },
  tempoSessaoMinutos: 34,
  tempoUsoTotalHoras: 24,
}

const targets = [
  { id: 'manutencao', nome: 'Manutenção' },
  { id: 'disponiveis', nome: 'Disponíveis' },
]

function setup(kind: CategoryKind, over: Partial<React.ComponentProps<typeof FleetCard>> = {}) {
  const handlers = { onOpen: vi.fn(), onDragStart: vi.fn(), onMove: vi.fn(), onRemove: vi.fn() }
  render(<FleetCard machine={machine} kind={kind} moveTargets={targets} {...handlers} {...over} />)
  return handlers
}

const field = (label: string) => screen.getByText(label).nextElementSibling?.textContent

describe('FleetCard', () => {
  it('shows name, code, sector and employee', () => {
    setup('custom')
    expect(screen.getByText('Empilhadeira Elétrica Titan-X')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(field('Setor:')).toBe('Expedição - Bloco B')
    expect(field('Funcionário:')).toBe('Alexandre Mattos')
  })

  it('shows (Indefinido) for a missing employee', () => {
    setup('custom', { machine: { ...machine, operadorConectado: undefined } })
    expect(field('Funcionário:')).toBe('(Indefinido)')
  })

  it('shows the last accident date and Urgente on accident cards', () => {
    setup('acidentes', { lastAccident: { data: '2026-01-23', hora: '14:38:20' } })
    expect(field('Data e Hora')).toBe('23 Janeiro 2026, 14:38:20')
    expect(field('Nível de urgência')).toBe('Urgente')
  })

  it.each([
    ['media', 'Média', 'caution'],
    ['alta', 'Alta', 'warning'],
    ['critica', 'Crítica', 'danger'],
  ] as const)('shows the %s urgency level with its color instead of Urgente', (urgency, label, tone) => {
    setup('acidentes', { urgency })
    const value = screen.getByText('Nível de urgência').nextElementSibling
    expect(value?.textContent).toBe(label)
    expect(value?.className).toContain(tone)
  })

  it('has no actions menu and is not draggable without move handlers', () => {
    render(<FleetCard machine={machine} kind="acidentes" onOpen={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Mais ações para EMP-084' })).not.toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveAttribute('draggable', 'false')
  })

  it('shows (Indefinido) when an accident card has no accident date', () => {
    setup('acidentes')
    expect(field('Data e Hora')).toBe('(Indefinido)')
  })

  it('shows the session time on active cards', () => {
    setup('ativas')
    expect(field('Tempo Sessão')).toBe('34 minutos')
  })

  it('shows the MAC address instead of the employee on maintenance cards', () => {
    setup('manutencao')
    expect(field('Endereço Mac:')).toBe('A:2C:99:B1:DF:7')
    expect(screen.queryByText('Funcionário:')).not.toBeInTheDocument()
  })

  it('shows the weekly hours on available cards', () => {
    setup('disponiveis')
    expect(field('Horas Totais(Semanal)')).toBe('24 horas')
  })

  it('shows (Indefinido) when available cards have no hours', () => {
    setup('disponiveis', { machine: { ...machine, tempoUsoTotalHoras: undefined } })
    expect(field('Horas Totais(Semanal)')).toBe('(Indefinido)')
  })

  it('shows no extra field on custom category cards', () => {
    setup('custom')
    for (const label of ['Data e Hora', 'Tempo Sessão', 'Endereço Mac:', 'Horas Totais(Semanal)']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
  })

  it('opens the machine when the card body is clicked', () => {
    const { onOpen } = setup('custom')
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Empilhadeira Elétrica Titan-X' }))
    expect(onOpen).toHaveBeenCalledWith(machine)
  })

  it('is draggable and reports the machine id on drag start', () => {
    const { onDragStart } = setup('custom')
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('draggable', 'true')
    fireEvent.dragStart(card)
    expect(onDragStart).toHaveBeenCalledWith('4')
  })

  it('opens a menu with the other categories and remove, without opening the card', () => {
    const { onOpen } = setup('custom')
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Manutenção',
      'Disponíveis',
      'Remover da categoria',
    ])
    expect(within(menu).getByText('Mover para')).toBeInTheDocument()
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('moves the machine to the chosen category and closes the menu', () => {
    const { onMove } = setup('custom')
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(onMove).toHaveBeenCalledWith('4', 'disponiveis')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('removes the machine from its category', () => {
    const { onRemove } = setup('custom')
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(onRemove).toHaveBeenCalledWith('4')
  })

  it('closes the menu on Escape', () => {
    setup('custom')
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('FleetCard drag feedback', () => {
  it('marks the card while it is being dragged', () => {
    setup('custom', { isDragging: true })
    expect(screen.getByRole('article')).toHaveAttribute('data-dragging', 'true')
  })

  it('marks the card that just arrived in the row', () => {
    setup('custom', { isArriving: true })
    expect(screen.getByRole('article')).toHaveAttribute('data-arriving', 'true')
  })

  it('has no drag marks by default', () => {
    setup('custom')
    expect(screen.getByRole('article')).not.toHaveAttribute('data-dragging')
    expect(screen.getByRole('article')).not.toHaveAttribute('data-arriving')
  })
})

describe('FleetCard accident urgency header (RST-10)', () => {
  const header = () => screen.getByRole('heading', { level: 3 }).closest('div[class*="topRow"]') as HTMLElement
  const value = () => screen.getByText('Nível de urgência').nextElementSibling as HTMLElement

  it.each([
    ['critica', 'danger'],
    ['alta', 'warning'],
    ['media', 'caution'],
  ] as const)('fills the %s accident header and colours its label with the same tone', (urgency, tone) => {
    setup('acidentes', { urgency })
    expect(header().className).toContain(tone)
    expect(value().className).toContain(tone)
  })

  it('falls back to the critical tone when the accident card has no urgency', () => {
    setup('acidentes')
    expect(header().className).toContain('danger')
    expect(value().className).toContain('danger')
  })

  it.each(['ativas', 'manutencao', 'disponiveis', 'custom'] as const)('uses no urgency or column tone on the %s header', (kind) => {
    setup(kind)
    for (const tone of ['danger', 'warning', 'caution', 'info', 'success']) {
      expect(header().className).not.toContain(tone)
    }
  })
})

describe('FleetCard header colored by machine status (RST-12)', () => {
  const header = () => screen.getByRole('heading', { level: 3 }).closest('div[class*="topRow"]') as HTMLElement
  const withStatus = (status: Machine['dispositivoConectado']['status']): Machine => ({
    ...machine,
    dispositivoConectado: { ...machine.dispositivoConectado, status },
  })

  it.each([
    ['Disponível', 'statusAvailable'],
    ['Em uso', 'statusInUse'],
    ['Manutenção', 'statusMaintenance'],
    ['Offline', 'statusOffline'],
  ] as const)('fills the header of a %s machine with %s', (status, cls) => {
    setup('custom', { machine: withStatus(status) })
    expect(header().className).toContain(cls)
  })

  it.each(['ativas', 'manutencao', 'disponiveis', 'custom'] as const)(
    'keeps the machine status color when the card sits in the %s column',
    (kind) => {
      setup(kind, { machine: withStatus('Em uso') })
      expect(header().className).toContain('statusInUse')
      for (const other of ['statusAvailable', 'statusMaintenance', 'statusOffline']) {
        expect(header().className).not.toContain(other)
      }
    }
  )

  it('keeps the urgency tone, not the status color, in the Acidentes column', () => {
    setup('acidentes', { machine: withStatus('Disponível'), urgency: 'alta' })
    expect(header().className).toContain('warning')
    expect(header().className).not.toContain('statusAvailable')
  })
})

describe('FleetCard without icon box (RST-11)', () => {
  it.each(['acidentes', 'ativas', 'manutencao', 'disponiveis', 'custom'] as const)(
    'renders no icon box on %s cards',
    (kind) => {
      setup(kind)
      expect(screen.getByRole('article').querySelector('[class*="icon"]')).toBeNull()
      for (const svg of screen.getByRole('article').querySelectorAll('svg')) expect(svg.closest('button')).not.toBeNull()
    }
  )

  it('keeps the title button reachable and opening the details', () => {
    const { onOpen } = setup('acidentes', { urgency: 'alta' })
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Empilhadeira Elétrica Titan-X' }))
    expect(onOpen).toHaveBeenCalledWith(machine)
  })

  it('keeps the ⋮ menu working', () => {
    const { onRemove } = setup('acidentes', { urgency: 'alta' })
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(onRemove).toHaveBeenCalledWith('4')
  })
})

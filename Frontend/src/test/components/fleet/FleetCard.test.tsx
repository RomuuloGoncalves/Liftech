import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FleetCard from '../../../components/fleet/FleetCard'
import type { Machine } from '../../../data/machines'

const machine: Machine = {
  id: '4',
  identificacao: 'EMP-084',
  nome: 'Empilhadeira Elétrica Titan-X',
  setor: 'Expedição - Bloco B',
  status: 'disponivel', categoriaId: null, categoriaTravada: false, dispositivoConectado: { enderecoMac: 'A:2C:99:B1:DF:7' },
  operadorConectado: { nome: 'Alexandre Mattos' },
  tempoSessaoMinutos: 34,
  tempoUsoTotalHoras: 24,
}

const targets = [
  { id: 'manutencao', nome: 'Manutenção' },
  { id: 'disponiveis', nome: 'Disponíveis' },
]

function setup(over: Partial<React.ComponentProps<typeof FleetCard>> = {}) {
  const handlers = { onOpen: vi.fn(), onDragStart: vi.fn(), onMove: vi.fn(), onRemove: vi.fn(), onToggleLock: vi.fn() }
  render(<FleetCard machine={machine} moveTargets={targets} {...handlers} {...over} />)
  return handlers
}

const withStatus = (status: Machine['status'], over: Partial<Machine> = {}) => ({
  machine: { ...machine, status, ...over },
})
const header = () => screen.getByRole('heading', { level: 3 }).closest('div[class*="topRow"]') as HTMLElement

const field = (label: string) => screen.getByText(label).nextElementSibling?.textContent

describe('FleetCard', () => {
  it('shows name, code, sector and employee', () => {
    setup()
    expect(screen.getByText('Empilhadeira Elétrica Titan-X')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(field('Setor:')).toBe('Expedição - Bloco B')
    expect(field('Funcionário:')).toBe('Alexandre Mattos')
  })

  it('shows (Indefinido) for a missing employee', () => {
    setup({ machine: { ...machine, operadorConectado: undefined } })
    expect(field('Funcionário:')).toBe('(Indefinido)')
  })

  it('shows the urgent level and alertaEm date on alerta cards (FRT-10)', () => {
    // Horário local: o mesmo instante tem de aparecer como o relógio do usuário mostra, não em UTC.
    const local = new Date(2026, 0, 23, 14, 38, 20)
    setup(withStatus('alerta', { alertaEm: local.toISOString() }))
    expect(field('Data e Hora')).toBe('23 Janeiro 2026, 14:38:20')
    expect(field('Nível de urgência')).toBe('Urgente')
  })

  it('shows (Indefinido) when an alerta card has no alertaEm', () => {
    setup(withStatus('alerta', { alertaEm: null }))
    expect(field('Data e Hora')).toBe('(Indefinido)')
  })

  it('has no actions menu and is not draggable without move handlers', () => {
    render(<FleetCard machine={machine} onOpen={vi.fn()} />)
    expect(screen.queryByRole('button', { name: 'Mais ações para EMP-084' })).not.toBeInTheDocument()
    expect(screen.getByRole('article')).toHaveAttribute('draggable', 'false')
  })

  it('shows the session time on em_uso cards', () => {
    setup(withStatus('em_uso'))
    expect(field('Tempo Sessão')).toBe('34 minutos')
  })

  it('shows the MAC address instead of the employee on manutencao cards', () => {
    setup(withStatus('manutencao'))
    expect(field('Endereço Mac:')).toBe('A:2C:99:B1:DF:7')
    expect(screen.queryByText('Funcionário:')).not.toBeInTheDocument()
  })

  it('shows the weekly hours on disponivel cards', () => {
    setup()
    expect(field('Horas Totais(Semanal)')).toBe('24 horas')
  })

  it('shows (Indefinido) when disponivel cards have no hours', () => {
    setup(withStatus('disponivel', { tempoUsoTotalHoras: undefined }))
    expect(field('Horas Totais(Semanal)')).toBe('(Indefinido)')
  })

  it('shows no highlight on offline cards', () => {
    setup(withStatus('offline'))
    for (const label of ['Data e Hora', 'Nível de urgência', 'Tempo Sessão', 'Endereço Mac:', 'Horas Totais(Semanal)']) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }
  })

  it('opens the machine when the card body is clicked', () => {
    const { onOpen } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Empilhadeira Elétrica Titan-X' }))
    expect(onOpen).toHaveBeenCalledWith(machine)
  })

  it('is draggable and reports the machine id on drag start', () => {
    const { onDragStart } = setup()
    const card = screen.getByRole('article')
    expect(card).toHaveAttribute('draggable', 'true')
    fireEvent.dragStart(card)
    expect(onDragStart).toHaveBeenCalledWith('4')
  })

  it('opens a menu with the other categories and remove, without opening the card', () => {
    const { onOpen } = setup()
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
    const { onMove } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(onMove).toHaveBeenCalledWith('4', 'disponiveis')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('removes the machine from its category', () => {
    const { onRemove } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(onRemove).toHaveBeenCalledWith('4')
  })

  it('closes the menu on Escape', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('FleetCard drag feedback', () => {
  it('marks the card while it is being dragged', () => {
    setup({ isDragging: true })
    expect(screen.getByRole('article')).toHaveAttribute('data-dragging', 'true')
  })

  it('marks the card that just arrived in the row', () => {
    setup({ isArriving: true })
    expect(screen.getByRole('article')).toHaveAttribute('data-arriving', 'true')
  })

  it('has no drag marks by default', () => {
    setup()
    expect(screen.getByRole('article')).not.toHaveAttribute('data-dragging')
    expect(screen.getByRole('article')).not.toHaveAttribute('data-arriving')
  })
})

describe('FleetCard driven by machine status (FRT-08, FRT-09)', () => {
  it.each([
    ['disponivel', 'Disponível', 'toneDisponivel'],
    ['em_uso', 'Em uso', 'toneEmUso'],
    ['manutencao', 'Em manutenção', 'toneManutencao'],
    ['alerta', 'Alerta', 'toneAlerta'],
    ['offline', 'Offline', 'toneOffline'],
  ] as const)('shows the %s badge and fills the header with its status tone', (status, label, tone) => {
    setup(withStatus(status))
    expect(screen.getByText(label, { selector: 'span' })).toBeInTheDocument()
    expect(header().className).toContain(tone)
  })
})

describe('FleetCard as an incident card (Alertas)', () => {
  const value = () => screen.getByText('Nível de urgência').nextElementSibling as HTMLElement

  it('shows the incident date whatever the machine status', () => {
    setup({ incident: { data: '2026-01-23', hora: '14:38:20' } })
    expect(field('Data e Hora')).toBe('23 Janeiro 2026, 14:38:20')
    expect(field('Nível de urgência')).toBe('Urgente')
  })

  it.each([
    ['media', 'Média', 'caution'],
    ['alta', 'Alta', 'warning'],
    ['critica', 'Crítica', 'danger'],
  ] as const)('shows the %s urgency with its tone on the label and header', (urgency, label, tone) => {
    setup({ incident: { data: '2026-01-23', hora: '14:38:20', urgency } })
    expect(value().textContent).toBe(label)
    expect(value().className).toContain(tone)
    expect(header().className).toContain(tone)
  })
})

describe('FleetCard lock (AUT-07)', () => {
  it('shows no padlock while the lock is off', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Destravar' })).not.toBeInTheDocument()
  })

  it('shows the padlock while locked and clicking it calls onToggleLock', () => {
    const { onToggleLock, onOpen } = setup(withStatus('disponivel', { categoriaTravada: true }))
    fireEvent.click(screen.getByRole('button', { name: 'Destravar' }))
    expect(onToggleLock).toHaveBeenCalledWith('4')
    expect(onOpen).not.toHaveBeenCalled()
  })
})

describe('FleetCard without icon box (RST-11)', () => {
  it.each(['alerta', 'em_uso', 'manutencao', 'disponivel', 'offline'] as const)(
    'renders no icon box on %s cards',
    (status) => {
      setup(withStatus(status))
      expect(screen.getByRole('article').querySelector('[class*="icon"]')).toBeNull()
      for (const svg of screen.getByRole('article').querySelectorAll('svg')) expect(svg.closest('button')).not.toBeNull()
    }
  )

  it('keeps the title button reachable and opening the details', () => {
    const { onOpen } = setup({ incident: { data: '2026-01-23', hora: '14:38:20', urgency: 'alta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Empilhadeira Elétrica Titan-X' }))
    expect(onOpen).toHaveBeenCalledWith(machine)
  })

  it('keeps the ⋮ menu working', () => {
    const { onRemove } = setup(withStatus('alerta'))
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações para EMP-084' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(onRemove).toHaveBeenCalledWith('4')
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MachineDetailModal from '../../../components/machines/MachineDetailModal'
import type { Machine, MachineEvent } from '../../../data/machines'

const machine: Machine = {
  id: '4',
  identificacao: 'EMP-084',
  nome: 'Empilhadeira Elétrica Titan-X',
  setor: 'Expedição - Bloco B',
  dispositivoConectado: { enderecoMac: 'A:2C:99:B1:DF:7', status: 'Disponível', nomeDispositivo: 'Mpa-5312' },
  tempoSessaoMinutos: 5,
  tempoUsoTotalHoras: 7,
}

const ev = (over: Partial<MachineEvent>): MachineEvent => ({
  id: 'e',
  machineId: '4',
  tipo: 'acidente',
  operador: 'Alexandre Gomes',
  data: '2025-09-14',
  inicio: '14:35:25',
  fim: '16:35:20',
  ...over,
})

const events = [
  ev({ id: 'a1' }),
  ev({ id: 'a2', operador: 'Carlos Silva', data: '2025-01-10', inicio: '08:00:00', fim: '08:45:00' }),
  ev({ id: 'm1', tipo: 'manutencao', operador: 'Ana Souza', data: '2025-05-20', inicio: '09:00:00', fim: '10:30:00' }),
]

function setup(props: Partial<React.ComponentProps<typeof MachineDetailModal>> = {}) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() }
  render(<MachineDetailModal machine={machine} events={events} {...handlers} {...props} />)
  return handlers
}

const setDate = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('MachineDetailModal: content', () => {
  it('shows nome, status badge, código and mac', () => {
    setup()

    expect(screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(screen.getByText('A:2C:99:B1:DF:7')).toBeInTheDocument()
  })

  it('shows the info card with setor, total usage and device name', () => {
    setup()

    expect(screen.getByText('Setor')).toBeInTheDocument()
    expect(screen.getByText('Expedição - Bloco B')).toBeInTheDocument()
    expect(screen.getByText('Tempo Uso (Total)')).toBeInTheDocument()
    expect(screen.getByText(/^7\s?h/)).toBeInTheDocument()
    expect(screen.getByText('Nome Dispositivo')).toBeInTheDocument()
    expect(screen.getByText('Mpa-5312')).toBeInTheDocument()
  })

  it('shows a dash for missing total usage and device name', () => {
    setup({
      machine: {
        ...machine,
        tempoUsoTotalHoras: undefined,
        dispositivoConectado: { enderecoMac: 'x', status: 'Offline' },
      },
    })

    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})

describe('MachineDetailModal: history', () => {
  it('opens on the accidents tab, newest first, with date, time range and duration', () => {
    setup()

    expect(screen.getByRole('tab', { name: 'Histórico de acidentes' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Histórico de manutenção' })).toHaveAttribute('aria-selected', 'false')
    const items = within(screen.getByRole('tabpanel')).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Alexandre Gomes')
    expect(items[0]).toHaveTextContent('Dom, 14 setembro 2025')
    expect(items[0]).toHaveTextContent('14:35:25 ~ 16:35:20 (2 horas)')
    expect(items[1]).toHaveTextContent('Carlos Silva')
    expect(items[1]).toHaveTextContent('08:00:00 ~ 08:45:00 (45 minutos)')
  })

  it('switches to maintenance and marks that tab selected', () => {
    setup()

    fireEvent.click(screen.getByRole('tab', { name: 'Histórico de manutenção' }))
    expect(screen.getByRole('tab', { name: 'Histórico de manutenção' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Histórico de acidentes' })).toHaveAttribute('aria-selected', 'false')
    const items = within(screen.getByRole('tabpanel')).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Ana Souza')
    expect(items[0]).toHaveTextContent('(1 hora 30 minutos)')
  })

  it('defaults the period to 14/07/2024 - 14/07/2026', () => {
    setup()

    expect(screen.getByLabelText('Data inicial')).toHaveValue('2024-07-14')
    expect(screen.getByLabelText('Data final')).toHaveValue('2026-07-14')
  })

  it('filters by the period, inclusive', () => {
    setup()

    setDate('Data inicial', '2025-09-14')
    expect(within(screen.getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(1)
    setDate('Data final', '2025-09-13')
    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows the empty state when the start date is after the end date', () => {
    setup()

    setDate('Data inicial', '2026-01-01')
    setDate('Data final', '2025-01-01')
    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows the empty state when the machine has no events', () => {
    setup({ events: [] })

    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })
})

describe('MachineDetailModal: actions', () => {
  it('calls onEdit and onDelete with the machine', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    expect(h.onEdit).toHaveBeenCalledWith(machine)
    expect(h.onDelete).toHaveBeenCalledWith(machine)
  })

  it('closes from the close icon, Escape and the backdrop', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(h.onClose).toHaveBeenCalledTimes(3)
  })
})

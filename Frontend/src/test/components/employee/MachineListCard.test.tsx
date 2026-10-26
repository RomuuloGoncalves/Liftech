import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MachineListCard from '../../../components/employee/MachineListCard'
import type { Machine, MachineStatus } from '../../../data/machines'

const machine = (status: MachineStatus = 'disponivel'): Machine => ({
  id: '1',
  identificacao: 'ID-0001',
  nome: 'Empilhadeira 01',
  setor: 'Galpão A',
  setorId: null,
  status,
  categoriaId: null,
  categoriaTravada: false,
  dispositivoConectado: { enderecoMac: 'AA:BB' },
  tempoSessaoMinutos: 0,
})

const setup = (props: Partial<React.ComponentProps<typeof MachineListCard>> = {}) => {
  const onAction = vi.fn()
  render(
    <MachineListCard
      machine={machine()}
      actionLabel="Selecionar"
      onAction={onAction}
      {...props}
    />
  )
  return onAction
}

describe('MachineListCard', () => {
  it('shows name, identification and sector', () => {
    setup()
    expect(screen.getByText('Empilhadeira 01')).toBeInTheDocument()
    expect(screen.getByText('ID-0001')).toBeInTheDocument()
    expect(screen.getByText('Setor')).toBeInTheDocument()
    expect(screen.getByText('Galpão A')).toBeInTheDocument()
  })

  it.each<[MachineStatus, string]>([
    ['disponivel', 'Disponível'],
    ['em_uso', 'Em uso'],
    ['manutencao', 'Em manutenção'],
    ['offline', 'Offline'],
    ['alerta', 'Alerta'],
  ])('shows the %s status chip', (status, label) => {
    setup({ machine: machine(status) })
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('shows date and time only when provided', () => {
    const { unmount } = render(
      <MachineListCard machine={machine('offline')} actionLabel="Ir" onAction={vi.fn()} />
    )
    expect(screen.queryByText('Data e Hora')).not.toBeInTheDocument()
    unmount()

    setup({ extra: { date: '10/10/2026', time: '08:30:00' } })
    expect(screen.getByText('Data e Hora')).toBeInTheDocument()
    expect(screen.getByText('10/10/2026')).toBeInTheDocument()
    expect(screen.getByText('08:30:00')).toBeInTheDocument()
  })

  it('renders date and time in two lines within the same dd', () => {
    setup({ extra: { date: '10/10/2026', time: '08:30:00' } })
    const dateEl = screen.getByText('10/10/2026')
    const timeEl = screen.getByText('08:30:00')
    const dd = dateEl.closest('dd')
    expect(dd).not.toBeNull()
    expect(timeEl.closest('dd')).toBe(dd)
    expect(dateEl.tagName).toBe('SPAN')
    expect(timeEl.tagName).toBe('SPAN')
  })

  it('renders sector with dt and dd with title', () => {
    setup()
    const sectorVal = screen.getByText('Galpão A')
    expect(sectorVal.tagName).toBe('DD')
    expect(sectorVal).toHaveAttribute('title', 'Galpão A')
    const dt = screen.getByText('Setor')
    expect(dt.tagName).toBe('DT')
  })

  it('calls onAction only from the action button', () => {
    const onAction = setup()
    fireEvent.click(screen.getByText('Empilhadeira 01'))
    expect(onAction).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Selecionar' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('disables the action button with actionDisabled', () => {
    const onAction = setup({ actionDisabled: true })
    const button = screen.getByRole('button', { name: 'Selecionar' })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onAction).not.toHaveBeenCalled()
  })
})

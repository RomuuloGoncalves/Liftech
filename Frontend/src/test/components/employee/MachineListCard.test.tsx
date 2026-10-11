import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MachineListCard from '../../../components/employee/MachineListCard'
import type { Machine, MachineStatus } from '../../../data/machines'

const machine = (status: MachineStatus = 'Disponível'): Machine => ({
  id: '1',
  identificacao: 'ID-0001',
  nome: 'Empilhadeira 01',
  setor: 'Galpão A',
  dispositivoConectado: { enderecoMac: 'AA:BB', status },
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
    ['Disponível', 'Disponível'],
    ['Em uso', 'Em uso'],
    ['Manutenção', 'Manutenção'],
    ['Offline', 'Offline'],
  ])('shows the %s status chip', (status, label) => {
    setup({ machine: machine(status) })
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('shows date and time only when provided', () => {
    const { unmount } = render(
      <MachineListCard machine={machine('Offline')} actionLabel="Ir" onAction={vi.fn()} />
    )
    expect(screen.queryByText('Data e Hora')).not.toBeInTheDocument()
    unmount()

    setup({ extra: { date: '10/10/2026', time: '08:30:00' } })
    expect(screen.getByText('Data e Hora')).toBeInTheDocument()
    expect(screen.getByText('10/10/2026')).toBeInTheDocument()
    expect(screen.getByText('08:30:00')).toBeInTheDocument()
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

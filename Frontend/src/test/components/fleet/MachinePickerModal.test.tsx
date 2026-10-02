import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MachinePickerModal from '../../../components/fleet/MachinePickerModal'
import { MACHINES, type Machine } from '../../../data/machines'

const pick = (...codes: string[]) => codes.map((code) => MACHINES.find((m) => m.identificacao === code)!)

function setup(machines: Machine[] = pick('EMP-084', 'EMP-085', 'EMP-086')) {
  const handlers = { onConfirm: vi.fn(), onClose: vi.fn() }
  render(<MachinePickerModal machines={machines} {...handlers} />)
  return handlers
}

const option = (code: string) => screen.getByRole('option', { name: `${code}(ID)` })
const chips = () =>
  within(screen.getByRole('group', { name: 'Máquinas selecionadas' }))
    .queryAllByRole('listitem')
    .map((li) => li.textContent)
const confirm = () => screen.getByRole('button', { name: 'Confirmar' })

describe('MachinePickerModal', () => {
  it('renders as a dialog titled "Selecione as máquinas" listing the given machines', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Selecione as máquinas' })).toBeInTheDocument()
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['EMP-084(ID)', 'EMP-085(ID)', 'EMP-086(ID)'])
  })

  it('toggles chip and check mark when a machine is clicked', () => {
    setup()
    fireEvent.click(option('EMP-084'))
    expect(option('EMP-084')).toHaveAttribute('aria-selected', 'true')
    expect(chips()).toEqual(['EMP-084(ID)'])

    fireEvent.click(option('EMP-084'))
    expect(option('EMP-084')).toHaveAttribute('aria-selected', 'false')
    expect(chips()).toEqual([])
  })

  it('unselects a machine with the chip x', () => {
    setup()
    fireEvent.click(option('EMP-084'))
    fireEvent.click(option('EMP-085'))
    fireEvent.click(screen.getByRole('button', { name: 'Remover EMP-084' }))
    expect(chips()).toEqual(['EMP-085(ID)'])
    expect(option('EMP-084')).toHaveAttribute('aria-selected', 'false')
  })

  it('filters the list by code or name', () => {
    setup()
    const search = screen.getByPlaceholderText('Procurar...')
    fireEvent.change(search, { target: { value: '086' } })
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['EMP-086(ID)'])
    fireEvent.change(search, { target: { value: 'atlas' } })
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['EMP-085(ID)'])
  })

  it('confirms the selected machine ids in selection order', () => {
    const { onConfirm } = setup()
    fireEvent.click(option('EMP-086'))
    fireEvent.click(option('EMP-084'))
    fireEvent.click(confirm())
    expect(onConfirm).toHaveBeenCalledWith([pick('EMP-086')[0].id, pick('EMP-084')[0].id])
  })

  it('disables Confirmar while nothing is selected', () => {
    setup()
    expect(confirm()).toBeDisabled()
  })

  it('shows the empty message and disables Confirmar when there are no machines', () => {
    setup([])
    expect(screen.getByText('Todas as máquinas já estão em uma categoria')).toBeInTheDocument()
    expect(confirm()).toBeDisabled()
  })

  it('closes on Cancelar', () => {
    const { onClose, onConfirm } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

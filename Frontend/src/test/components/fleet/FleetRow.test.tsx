import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FleetRow from '../../../components/fleet/FleetRow'
import { lastAccidentDate, type FleetCategory } from '../../../data/fleet'
import { MACHINES, MACHINE_EVENTS, type Machine } from '../../../data/machines'

const pick = (...codes: string[]) => codes.map((code) => MACHINES.find((m) => m.identificacao === code)!)

const category = (over: Partial<FleetCategory> = {}): FleetCategory => ({
  id: 'ativas',
  kind: 'ativas',
  nome: '',
  cor: '#3A9CFF',
  machineIds: [],
  ...over,
})

function setup(machines: Machine[], over: Partial<React.ComponentProps<typeof FleetRow>> = {}) {
  const handlers = { onDrop: vi.fn(), onAdd: vi.fn(), onDelete: vi.fn() }
  render(
    <FleetRow
      category={category({ machineIds: machines.map((m) => m.id) })}
      label="Ativas"
      machines={machines}
      total={machines.length}
      renderCard={(m) => <article key={m.id}>{m.identificacao}</article>}
      {...handlers}
      {...over}
    />
  )
  return handlers
}

const cards = () => screen.queryAllByRole('article').map((a) => a.textContent)

describe('FleetRow', () => {
  it('shows the category label, color and machine count', () => {
    setup(pick('EMP-082', 'EMP-087'))
    const region = screen.getByRole('region', { name: 'Ativas' })
    expect(within(region).getByText('Ativas')).toBeInTheDocument()
    expect(within(region).getByLabelText('2 máquinas')).toHaveTextContent('2')
    expect(region.style.getPropertyValue('--category-color')).toBe('#3A9CFF')
  })

  it('renders the cards in order', () => {
    setup(pick('EMP-082', 'EMP-087'))
    expect(cards()).toEqual(['EMP-082', 'EMP-087'])
  })

  it('shows only the add button when the category is empty', () => {
    const { onAdd } = setup([])
    expect(cards()).toEqual([])
    expect(screen.queryByText('Nenhuma máquina encontrada')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    expect(onAdd).toHaveBeenCalledWith('ativas')
  })

  it('also offers the add button when the row has machines', () => {
    const { onAdd } = setup(pick('EMP-082'))
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    expect(onAdd).toHaveBeenCalledWith('ativas')
  })

  it('filters its own cards by name or code and keeps the total count', () => {
    setup(pick('EMP-082', 'EMP-085'))
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'atlas' } })
    expect(cards()).toEqual(['EMP-085'])
    expect(screen.getByLabelText('2 máquinas')).toHaveTextContent('2')
  })

  it('shows "Nenhuma máquina encontrada" when filters hide every card', () => {
    setup(pick('EMP-082'))
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'zzz' } })
    expect(screen.getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
  })

  it('shows the no-results message when the page filter already emptied the row', () => {
    setup([], { total: 3 })
    expect(screen.getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
    expect(screen.getByLabelText('3 máquinas')).toHaveTextContent('3')
  })

  it('calls onDrop with its id when a card is dropped and allows dropping on dragover', () => {
    const { onDrop } = setup(pick('EMP-082'))
    const region = screen.getByRole('region', { name: 'Ativas' })
    const dragOver = new Event('dragover', { bubbles: true, cancelable: true })
    region.dispatchEvent(dragOver)
    expect(dragOver.defaultPrevented).toBe(true)
    fireEvent.drop(region)
    expect(onDrop).toHaveBeenCalledWith('ativas')
  })

  it('shows the period only on the accidents row and filters by last accident date', () => {
    const machines = pick('EMP-081', 'EMP-085')
    setup(machines, { category: category({ id: 'acidentes', kind: 'acidentes' }), label: 'Acidentes' })
    expect(screen.getByLabelText('Data inicial')).toHaveValue('2024-07-14')
    expect(screen.getByLabelText('Data final')).toHaveValue('2026-07-14')
    expect(cards()).toEqual(['EMP-081', 'EMP-085'])

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2030-01-01' } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2030-12-31' } })
    expect(cards()).toEqual([])
    expect(screen.getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
  })

  it('includes both period bounds when filtering by last accident date', () => {
    const [machine] = pick('EMP-081')
    const day = lastAccidentDate(machine.id, MACHINE_EVENTS)!.data
    const shift = (days: number) => new Date(Date.parse(day) + days * 86_400_000).toISOString().slice(0, 10)
    setup([machine], { category: category({ id: 'acidentes', kind: 'acidentes' }), label: 'Acidentes' })

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: day } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: day } })
    expect(cards()).toEqual(['EMP-081'])

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: shift(1) } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: shift(2) } })
    expect(cards()).toEqual([])

    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: shift(-2) } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: shift(-1) } })
    expect(cards()).toEqual([])
  })

  it('does not show the period on other rows', () => {
    setup(pick('EMP-082'))
    expect(screen.queryByLabelText('Data inicial')).not.toBeInTheDocument()
  })

  it('shows "Excluir categoria" only on custom categories', () => {
    const { onDelete } = setup([], { category: category({ id: 'custom-1', kind: 'custom', nome: 'Reserva' }), label: 'Reserva' })
    fireEvent.click(screen.getByRole('button', { name: 'Excluir categoria' }))
    expect(onDelete).toHaveBeenCalledWith('custom-1')
  })

  it('hides "Excluir categoria" on the initial categories', () => {
    setup([])
    expect(screen.queryByRole('button', { name: 'Excluir categoria' })).not.toBeInTheDocument()
  })
})

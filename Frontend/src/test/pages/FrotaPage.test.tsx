import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../components/common/Toast'
import FrotaPage from '../../pages/FrotaPage'

const loading = vi.hoisted(() => ({ value: false }))
vi.mock('../../hooks/useFirstVisitLoading', () => ({ useFirstVisitLoading: () => loading.value }))

const row = (name: string) => screen.getByRole('region', { name })
const queryRow = (name: string) => screen.queryByRole('region', { name })
const codesIn = (name: string) =>
  within(row(name))
    .queryAllByRole('article')
    .map((card) => within(card).getByText(/\(ID\)$/).textContent)
const countOf = (name: string) => within(row(name)).getByLabelText(/máquinas$/).textContent
const card = (code: string) => screen.getByText(`${code}(ID)`).closest('article')!

const openMenu = (code: string) => fireEvent.click(screen.getByRole('button', { name: `Mais ações para ${code}` }))

const createCategory = (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar categoria' }))
  fireEvent.change(screen.getByLabelText('Nome da categoria'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar Categoria' }))
}

const pickerOptions = () =>
  within(screen.getByRole('listbox')).getAllByRole('option').map((o) => o.textContent)

describe('FrotaPage', () => {
  it('renders the four initial rows in order', () => {
    render(<FrotaPage />)
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual([
      'Acidentes',
      'Ativas',
      'Manutenção',
      'Disponíveis',
    ])
  })

  it('places machines by the initial rule and leaves Offline machines out', () => {
    render(<FrotaPage />)
    expect(codesIn('Acidentes')).toEqual(['EMP-081(ID)', 'EMP-085(ID)', 'EMP-089(ID)'])
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
    expect(codesIn('Manutenção')).toContain('EMP-084(ID)')
    expect(codesIn('Disponíveis')).toContain('EMP-083(ID)')
    expect(screen.queryByText('EMP-086(ID)')).not.toBeInTheDocument()
  })

  it('moves a dragged card to the end of the drop row and updates both counters', () => {
    render(<FrotaPage />)
    const ativas = Number(countOf('Ativas'))
    const manutencao = Number(countOf('Manutenção'))

    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))

    expect(codesIn('Manutenção').at(-1)).toBe('EMP-082(ID)')
    expect(codesIn('Ativas')).not.toContain('EMP-082(ID)')
    expect(countOf('Ativas')).toBe(String(ativas - 1))
    expect(countOf('Manutenção')).toBe(String(manutencao + 1))
  })

  it('keeps the order when a card is dropped on its own row', () => {
    render(<FrotaPage />)
    const before = codesIn('Ativas')
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Ativas'))
    expect(codesIn('Ativas')).toEqual(before)
  })

  it('keeps the machine in place when the drag ends outside any row', () => {
    render(<FrotaPage />)
    const before = codesIn('Manutenção')
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.dragEnd(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    expect(codesIn('Manutenção')).toEqual(before)
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
  })

  it('moves a machine through the card menu', () => {
    render(<FrotaPage />)
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(codesIn('Disponíveis').at(-1)).toBe('EMP-082(ID)')
    expect(codesIn('Ativas')).not.toContain('EMP-082(ID)')
  })

  it('removes a machine from its category and offers it in the picker', () => {
    render(<FrotaPage />)
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(screen.queryByText('EMP-082(ID)')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    expect(pickerOptions()).toContain('EMP-082(ID)')
  })

  it('creates an empty category at the end from "Cadastrar categoria"', () => {
    render(<FrotaPage />)
    createCategory('Reserva')
    const regions = screen.getAllByRole('region')
    expect(regions.at(-1)).toHaveAttribute('aria-label', 'Reserva')
    expect(codesIn('Reserva')).toEqual([])
    expect(countOf('Reserva')).toBe('0')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens "Criar Categoria" from the + below the rows', () => {
    render(<FrotaPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar categoria' }))
    expect(screen.getByRole('dialog', { name: 'Criar Categoria' })).toBeInTheDocument()
  })

  it('rejects a category name already used by an initial category', () => {
    render(<FrotaPage />)
    createCategory('ativas')
    expect(screen.getByText('Já existe uma categoria com esse nome')).toBeInTheDocument()
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })

  it('adds machines without category to a row through the picker', () => {
    render(<FrotaPage />)
    createCategory('Reserva')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Reserva' }))
    expect(pickerOptions()).toEqual(['EMP-086(ID)', 'EMP-094(ID)'])
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(codesIn('Reserva')).toEqual(['EMP-086(ID)'])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes a created category after confirmation and frees its machines', () => {
    render(<FrotaPage />)
    createCategory('Reserva')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Reserva' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    fireEvent.click(within(row('Reserva')).getByRole('button', { name: 'Excluir categoria' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Reserva')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' }))

    expect(queryRow('Reserva')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    expect(pickerOptions()).toContain('EMP-086(ID)')
  })

  it('keeps the category when the deletion is cancelled', () => {
    render(<FrotaPage />)
    createCategory('Reserva')
    fireEvent.click(within(row('Reserva')).getByRole('button', { name: 'Excluir categoria' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(row('Reserva')).toBeInTheDocument()
  })

  it('filters every row with the top search and keeps the counters', () => {
    render(<FrotaPage />)
    const total = countOf('Ativas')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar' }), { target: { value: '085' } })
    expect(codesIn('Acidentes')).toEqual(['EMP-085(ID)'])
    expect(codesIn('Ativas')).toEqual([])
    expect(within(row('Ativas')).getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
    expect(countOf('Ativas')).toBe(total)
  })

  it('shows only the chosen category with the category filter', () => {
    render(<FrotaPage />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar categoria' }), { target: { value: 'manutencao' } })
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual(['Manutenção'])
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar categoria' }), { target: { value: 'all' } })
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })

  it('opens the fleet detail modal when a card is clicked', () => {
    render(<FrotaPage />)
    fireEvent.click(within(card('EMP-082')).getByRole('button', { name: /Ver detalhes/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Funcionário')).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Histórico de reparos' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
  })

  it('does not open the detail when the card menu is used', () => {
    render(<FrotaPage />)
    openMenu('EMP-082')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open the detail when a card is dragged', () => {
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.dragEnd(card('EMP-082'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the machine status after moving it to another category', () => {
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    fireEvent.click(within(card('EMP-082')).getByRole('button', { name: /Ver detalhes/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Em uso')).toBeInTheDocument()
    expect(within(dialog).queryByText('Manutenção')).not.toBeInTheDocument()
  })

  it('goes back to all categories when the filtered category is deleted', () => {
    render(<FrotaPage />)
    createCategory('Reserva')
    const filter = screen.getByRole('combobox', { name: 'Filtrar categoria' })
    const reservaId = within(filter).getByRole('option', { name: 'Reserva' }).getAttribute('value')!
    fireEvent.change(filter, { target: { value: reservaId } })
    fireEvent.click(within(row('Reserva')).getByRole('button', { name: 'Excluir categoria' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))
    expect(filter).toHaveValue('all')
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })
})

describe('FrotaPage drag feedback', () => {
  afterEach(() => vi.useRealTimers())

  const dragOver = (name: string) => fireEvent.dragOver(row(name))

  it('marks the dragged card until the drag ends', () => {
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    expect(card('EMP-082')).toHaveAttribute('data-dragging', 'true')
    fireEvent.dragEnd(card('EMP-082'))
    expect(card('EMP-082')).not.toHaveAttribute('data-dragging')
  })

  it('highlights only the row under the card when it is not the source row', () => {
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    dragOver('Manutenção')
    expect(row('Manutenção')).toHaveAttribute('data-drop-target', 'true')
    expect(row('Disponíveis')).not.toHaveAttribute('data-drop-target')

    dragOver('Ativas')
    expect(row('Ativas')).not.toHaveAttribute('data-drop-target')
    expect(row('Manutenção')).not.toHaveAttribute('data-drop-target')
  })

  it('does not highlight rows when nothing is being dragged', () => {
    render(<FrotaPage />)
    dragOver('Manutenção')
    expect(row('Manutenção')).not.toHaveAttribute('data-drop-target')
  })

  it('clears every mark when the card is dropped', () => {
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    dragOver('Manutenção')
    fireEvent.drop(row('Manutenção'))
    expect(screen.getAllByRole('region').filter((r) => r.hasAttribute('data-drop-target'))).toEqual([])
    expect(card('EMP-082')).not.toHaveAttribute('data-dragging')
  })

  it('clears every mark when the drag is cancelled outside the rows', () => {
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    dragOver('Manutenção')
    fireEvent.dragEnd(card('EMP-082'))
    expect(row('Manutenção')).not.toHaveAttribute('data-drop-target')
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
    expect(codesIn('Manutenção')).not.toContain('EMP-082(ID)')
  })

  it('flashes a card dropped in another row for 1 second', () => {
    vi.useFakeTimers()
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    expect(card('EMP-082')).toHaveAttribute('data-arriving', 'true')
    act(() => vi.advanceTimersByTime(999))
    expect(card('EMP-082')).toHaveAttribute('data-arriving', 'true')
    act(() => vi.advanceTimersByTime(1))
    expect(card('EMP-082')).not.toHaveAttribute('data-arriving')
  })

  it('does not flash a card dropped on its own row', () => {
    render(<FrotaPage />)
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Ativas'))
    expect(card('EMP-082')).not.toHaveAttribute('data-arriving')
  })

  it('flashes a card moved with the menu', () => {
    render(<FrotaPage />)
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(card('EMP-082')).toHaveAttribute('data-arriving', 'true')
  })

  it('flashes every card added through the picker', () => {
    render(<FrotaPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-094(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(card('EMP-086')).toHaveAttribute('data-arriving', 'true')
    expect(card('EMP-094')).toHaveAttribute('data-arriving', 'true')
  })
})

describe('FrotaPage skeleton', () => {
  afterEach(() => {
    loading.value = false
  })

  it('shows the kanban skeleton without toolbar while loading', () => {
    loading.value = true
    render(<FrotaPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(screen.queryByRole('button', { name: 'Cadastrar categoria' })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('region')).toEqual([])
  })

  it('shows the board when not loading', () => {
    render(<FrotaPage />)
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cadastrar categoria' })).toBeInTheDocument()
  })
})

describe('FrotaPage notifications', () => {
  const renderWithToasts = () =>
    render(
      <ToastProvider>
        <FrotaPage />
      </ToastProvider>
    )
  const toastTexts = () =>
    within(screen.getByRole('status'))
      .queryAllByRole('listitem')
      .map((li) => li.textContent)

  it('announces a created category', () => {
    renderWithToasts()
    createCategory('Reserva')
    expect(toastTexts()).toEqual(['Categoria "Reserva" criada'])
  })

  it('announces a deleted category', () => {
    renderWithToasts()
    createCategory('Reserva')
    fireEvent.click(within(row('Reserva')).getByRole('button', { name: 'Excluir categoria' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))
    expect(toastTexts()).toContain('Categoria "Reserva" excluída')
  })

  it('announces machines added to a category', () => {
    renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(toastTexts()).toEqual(['Máquinas adicionadas a "Ativas"'])
  })

  it('announces a machine removed from its category', () => {
    renderWithToasts()
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(toastTexts()).toEqual(['EMP-082 removida da categoria'])
  })
})

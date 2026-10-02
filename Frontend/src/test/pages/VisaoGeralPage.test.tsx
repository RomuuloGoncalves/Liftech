import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '../../components/common/Toast'
import VisaoGeralPage from '../../pages/VisaoGeralPage'

const loading = vi.hoisted(() => ({ value: false }))
vi.mock('../../hooks/useFirstVisitLoading', () => ({ useFirstVisitLoading: () => loading.value }))
import { MACHINES } from '../../data/machines'

describe('VisaoGeralPage', () => {
  it('renders one card per machine in the mock dataset', () => {
    render(<VisaoGeralPage />)
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('renders the Cadastrar Máquina button and the search field', () => {
    render(<VisaoGeralPage />)
    expect(screen.getByRole('button', { name: /cadastrar máquina/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('filters cards by identificação/setor as the user types in the search field', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'EMP-084' } })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
  })

  it('shows all machines again after the search field is cleared', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'EMP-084' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)

    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('keeps the active status filter applied after the search field is cleared', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')
    const select = screen.getByRole('combobox', { name: /filtrar máquinas por status/i })

    fireEvent.change(select, { target: { value: 'Manutenção' } })
    fireEvent.change(search, { target: { value: 'EMP-084' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)

    fireEvent.change(search, { target: { value: '' } })

    const expectedCount = MACHINES.filter(
      (machine) => machine.dispositivoConectado.status === 'Manutenção'
    ).length
    expect(screen.getAllByRole('article')).toHaveLength(expectedCount)
  })

  it('filters cards by status when a status is selected in the filter', () => {
    render(<VisaoGeralPage />)
    const select = screen.getByRole('combobox', { name: /filtrar máquinas por status/i })

    fireEvent.change(select, { target: { value: 'Manutenção' } })

    const expectedCount = MACHINES.filter(
      (machine) => machine.dispositivoConectado.status === 'Manutenção'
    ).length
    expect(screen.getAllByRole('article')).toHaveLength(expectedCount)
  })

  it('shows the empty state message when search + filter match nothing', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'inexistente-xyz' } })

    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
  })

  it('opens the Nova Máquina panel when Cadastrar Máquina is clicked', () => {
    render(<VisaoGeralPage />)
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))
    expect(screen.getByRole('dialog', { name: 'Nova Máquina' })).toBeInTheDocument()
  })

  it('adds a new card to the grid with status Disponível and 0 minutos after a successful submit, and closes the panel', () => {
    render(<VisaoGeralPage />)
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Nova' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.queryByRole('dialog', { name: 'Nova Máquina' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length + 1)
    const newCard = screen.getByText('EMP-999(ID)').closest('article') as HTMLElement
    expect(newCard).not.toBeNull()
    expect(within(newCard).getByText('Disponível')).toBeInTheDocument()
    expect(within(newCard).getByText('0 min')).toBeInTheDocument()
  })

  it('does not add a card and closes the panel when Cancelar is clicked', () => {
    render(<VisaoGeralPage />)
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Descartada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog', { name: 'Nova Máquina' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('keeps the active search and status filter after opening and closing the panel', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')
    fireEvent.change(search, { target: { value: 'EMP-084' } })

    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(search).toHaveValue('EMP-084')
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })
})

function cardOf(code: string): HTMLElement {
  return screen.getAllByRole('article').find((card) => within(card).queryByText(`${code}(ID)`)) as HTMLElement
}

function openDetail(code: string) {
  const card = cardOf(code)
  fireEvent.click(within(card).getByRole('button', { name: /Ver detalhes de/ }))
}

describe('VisaoGeralPage: machine detail', () => {
  it('opens the detail modal with the machine data when a card is clicked', () => {
    render(<VisaoGeralPage />)

    openDetail('EMP-084')
    const dialog = screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })
    expect(within(dialog).getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(within(dialog).getByText('Nome Dispositivo')).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Histórico de acidentes' })).toHaveAttribute('aria-selected', 'true')
  })

  it('closes the detail modal with Escape', () => {
    render(<VisaoGeralPage />)

    openDetail('EMP-084')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('edits the machine: the drawer opens filled in and the card shows the new setor', () => {
    render(<VisaoGeralPage />)

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    expect(screen.getByRole('dialog', { name: 'Editar Máquina' })).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toHaveValue('EMP-084')
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'Doca Nova' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))

    const card = cardOf('EMP-084')
    expect(within(card).getByText('Doca Nova')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText('Doca Nova')).toBeInTheDocument()
  })

  it('keeps the machine unchanged when the edit is cancelled', () => {
    render(<VisaoGeralPage />)

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'Doca Nova' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    const card = cardOf('EMP-084')
    expect(within(card).queryByText('Doca Nova')).not.toBeInTheDocument()
  })

  it('keeps the active search after editing', () => {
    render(<VisaoGeralPage />)

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'emp-084' } })
    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'Doca Nova' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('searchbox')).toHaveValue('emp-084')
  })

  it('deletes the machine after confirming, closing every dialog', () => {
    render(<VisaoGeralPage />)

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    expect(screen.getByRole('dialog', { name: 'Excluir máquina' })).toBeInTheDocument()
    expect(screen.getByText(/Excluir Empilhadeira Elétrica Titan-X \(EMP-084\)\?/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('EMP-084(ID)')).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length - 1)
  })

  it('keeps the machine and returns to the detail modal when the delete is cancelled', () => {
    render(<VisaoGeralPage />)

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('does not open the detail when the menu button of a card is clicked', () => {
    render(<VisaoGeralPage />)

    fireEvent.click(screen.getByRole('button', { name: /mais ações para emp-084/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an empty history for a machine created in the UI', () => {
    render(<VisaoGeralPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova Empilhadeira' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-200' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    openDetail('EMP-200')

    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })
})

describe('VisaoGeralPage skeleton', () => {
  afterEach(() => {
    loading.value = false
  })

  it('shows the grid skeleton without toolbar while loading', () => {
    loading.value = true
    const { container } = render(<VisaoGeralPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(container.querySelectorAll('[data-skeleton-card]')).toHaveLength(8)
    expect(screen.queryByRole('button', { name: /cadastrar máquina/i })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toEqual([])
  })
})

describe('VisaoGeralPage notifications', () => {
  const renderWithToasts = () =>
    render(
      <ToastProvider>
        <VisaoGeralPage />
      </ToastProvider>
    )
  const toastTexts = () =>
    within(screen.getByRole('status'))
      .queryAllByRole('listitem')
      .map((li) => li.textContent)
  const open = (code: string) =>
    fireEvent.click(
      within(screen.getByText(`${code}(ID)`).closest('article') as HTMLElement).getByRole('button', { name: /Ver detalhes/ })
    )

  it('announces a registered machine', () => {
    renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Nova' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-999' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(toastTexts()).toEqual(['Máquina "EMP-999" cadastrada'])
  })

  it('announces a saved machine', () => {
    renderWithToasts()
    open('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'Doca Nova' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))
    expect(toastTexts()).toEqual(['Máquina "EMP-084" salva'])
  })

  it('announces a deleted machine', () => {
    renderWithToasts()
    open('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(toastTexts()).toEqual(['Máquina "EMP-084" excluída'])
  })
})

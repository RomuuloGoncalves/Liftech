import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../components/common/Toast'
import { ActiveBranchProvider, useActiveBranch } from '../../context/ActiveBranchContext'
import { MACHINES as MOCK, type Machine } from '../../data/machines'
import FrotaPage from '../../pages/FrotaPage'
import styles from '../../pages/FrotaPage.module.css'
import { categoryService, type Categoria } from '../../services/categoryService'
import { machineService } from '../../services/machineService'

vi.mock('../../services/machineService', () => ({ machineService: { listar: vi.fn() } }))
vi.mock('../../services/categoryService', () => ({ categoryService: { listar: vi.fn() } }))

const listarMaquinas = vi.mocked(machineService.listar)
const listarCategorias = vi.mocked(categoryService.listar)

const categoria = (chave: string, statusVinculados: Machine['status'][]): Categoria => ({
  _id: chave,
  nome: chave,
  cor: '#3A9CFF',
  chave,
  statusVinculados,
})
const CATEGORIAS = [
  categoria('acidentes', ['alerta']),
  categoria('ativas', ['em_uso']),
  categoria('manutencao', ['manutencao']),
  categoria('disponiveis', ['disponivel']),
]
// Quadro inicial: cada máquina na categoria ligada ao status; offline fica sem categoria.
const MACHINES: Machine[] = MOCK.map((m) => ({
  ...m,
  categoriaId: CATEGORIAS.find((c) => c.statusVinculados.includes(m.status))?._id ?? null,
}))

beforeEach(() => {
  listarMaquinas.mockReset()
  listarCategorias.mockReset()
  listarMaquinas.mockResolvedValue(MACHINES)
  listarCategorias.mockResolvedValue(CATEGORIAS)
})

const renderPage = async (ui: React.ReactElement = <FrotaPage />) => {
  const view = render(ui)
  await screen.findByRole('button', { name: 'Cadastrar categoria' })
  return view
}

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
  it('renders the four initial rows in order', async () => {
    await renderPage()
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual([
      'Acidentes',
      'Ativas',
      'Manutenção',
      'Disponíveis',
    ])
  })

  it('places machines by the initial rule and leaves Offline machines out', async () => {
    await renderPage()
    expect(codesIn('Acidentes')).toEqual(['EMP-081(ID)', 'EMP-085(ID)', 'EMP-089(ID)'])
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
    expect(codesIn('Manutenção')).toContain('EMP-084(ID)')
    expect(codesIn('Disponíveis')).toContain('EMP-083(ID)')
    expect(screen.queryByText('EMP-086(ID)')).not.toBeInTheDocument()
  })

  it('moves a dragged card to the end of the drop row and updates both counters', async () => {
    await renderPage()
    const ativas = Number(countOf('Ativas'))
    const manutencao = Number(countOf('Manutenção'))

    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))

    expect(codesIn('Manutenção').at(-1)).toBe('EMP-082(ID)')
    expect(codesIn('Ativas')).not.toContain('EMP-082(ID)')
    expect(countOf('Ativas')).toBe(String(ativas - 1))
    expect(countOf('Manutenção')).toBe(String(manutencao + 1))
  })

  it('keeps the order when a card is dropped on its own row', async () => {
    await renderPage()
    const before = codesIn('Ativas')
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Ativas'))
    expect(codesIn('Ativas')).toEqual(before)
  })

  it('keeps the machine in place when the drag ends outside any row', async () => {
    await renderPage()
    const before = codesIn('Manutenção')
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.dragEnd(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    expect(codesIn('Manutenção')).toEqual(before)
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
  })

  it('moves a machine through the card menu', async () => {
    await renderPage()
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(codesIn('Disponíveis').at(-1)).toBe('EMP-082(ID)')
    expect(codesIn('Ativas')).not.toContain('EMP-082(ID)')
  })

  it('removes a machine from its category and offers it in the picker', async () => {
    await renderPage()
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(screen.queryByText('EMP-082(ID)')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    expect(pickerOptions()).toContain('EMP-082(ID)')
  })

  it('creates an empty category at the end from "Cadastrar categoria"', async () => {
    await renderPage()
    createCategory('Reserva')
    const regions = screen.getAllByRole('region')
    expect(regions.at(-1)).toHaveAttribute('aria-label', 'Reserva')
    expect(codesIn('Reserva')).toEqual([])
    expect(countOf('Reserva')).toBe('0')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens "Criar Categoria" from the + below the rows', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar categoria' }))
    expect(screen.getByRole('dialog', { name: 'Criar Categoria' })).toBeInTheDocument()
  })

  it('rejects a category name already used by an initial category', async () => {
    await renderPage()
    createCategory('ativas')
    expect(screen.getByText('Já existe uma categoria com esse nome')).toBeInTheDocument()
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })

  it('adds machines without category to a row through the picker', async () => {
    await renderPage()
    createCategory('Reserva')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Reserva' }))
    expect(pickerOptions()).toEqual(['EMP-086(ID)', 'EMP-094(ID)'])
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(codesIn('Reserva')).toEqual(['EMP-086(ID)'])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes a created category after confirmation and frees its machines', async () => {
    await renderPage()
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

  it('keeps the category when the deletion is cancelled', async () => {
    await renderPage()
    createCategory('Reserva')
    fireEvent.click(within(row('Reserva')).getByRole('button', { name: 'Excluir categoria' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(row('Reserva')).toBeInTheDocument()
  })

  it('filters every row with the top search and keeps the counters', async () => {
    await renderPage()
    const total = countOf('Ativas')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar' }), { target: { value: '085' } })
    expect(codesIn('Acidentes')).toEqual(['EMP-085(ID)'])
    expect(codesIn('Ativas')).toEqual([])
    expect(within(row('Ativas')).getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
    expect(countOf('Ativas')).toBe(total)
  })

  it('shows only the chosen category with the category filter', async () => {
    await renderPage()
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar categoria' }), { target: { value: 'manutencao' } })
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual(['Manutenção'])
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar categoria' }), { target: { value: 'all' } })
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })

  it('opens the fleet detail modal when a card is clicked', async () => {
    await renderPage()
    fireEvent.click(within(card('EMP-082')).getByRole('button', { name: /Ver detalhes/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Funcionário')).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Histórico de reparos' })).toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
  })

  it('does not open the detail when the card menu is used', async () => {
    await renderPage()
    openMenu('EMP-082')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not open the detail when a card is dragged', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.dragEnd(card('EMP-082'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the machine status after moving it to another category', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    fireEvent.click(within(card('EMP-082')).getByRole('button', { name: /Ver detalhes/ }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Em uso')).toBeInTheDocument()
    expect(within(dialog).queryByText('Manutenção')).not.toBeInTheDocument()
  })

  it('goes back to all categories when the filtered category is deleted', async () => {
    await renderPage()
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

  it('marks the dragged card until the drag ends', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    expect(card('EMP-082')).toHaveAttribute('data-dragging', 'true')
    fireEvent.dragEnd(card('EMP-082'))
    expect(card('EMP-082')).not.toHaveAttribute('data-dragging')
  })

  it('highlights only the row under the card when it is not the source row', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    dragOver('Manutenção')
    expect(row('Manutenção')).toHaveAttribute('data-drop-target', 'true')
    expect(row('Disponíveis')).not.toHaveAttribute('data-drop-target')

    dragOver('Ativas')
    expect(row('Ativas')).not.toHaveAttribute('data-drop-target')
    expect(row('Manutenção')).not.toHaveAttribute('data-drop-target')
  })

  it('does not highlight rows when nothing is being dragged', async () => {
    await renderPage()
    dragOver('Manutenção')
    expect(row('Manutenção')).not.toHaveAttribute('data-drop-target')
  })

  it('clears every mark when the card is dropped', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    dragOver('Manutenção')
    fireEvent.drop(row('Manutenção'))
    expect(screen.getAllByRole('region').filter((r) => r.hasAttribute('data-drop-target'))).toEqual([])
    expect(card('EMP-082')).not.toHaveAttribute('data-dragging')
  })

  it('clears every mark when the drag is cancelled outside the rows', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    dragOver('Manutenção')
    fireEvent.dragEnd(card('EMP-082'))
    expect(row('Manutenção')).not.toHaveAttribute('data-drop-target')
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
    expect(codesIn('Manutenção')).not.toContain('EMP-082(ID)')
  })

  it('flashes a card dropped in another row for 1 second', async () => {
    await renderPage()
    vi.useFakeTimers()
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    expect(card('EMP-082')).toHaveAttribute('data-arriving', 'true')
    act(() => vi.advanceTimersByTime(999))
    expect(card('EMP-082')).toHaveAttribute('data-arriving', 'true')
    act(() => vi.advanceTimersByTime(1))
    expect(card('EMP-082')).not.toHaveAttribute('data-arriving')
  })

  it('does not flash a card dropped on its own row', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Ativas'))
    expect(card('EMP-082')).not.toHaveAttribute('data-arriving')
  })

  it('flashes a card moved with the menu', async () => {
    await renderPage()
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(card('EMP-082')).toHaveAttribute('data-arriving', 'true')
  })

  it('flashes every card added through the picker', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-094(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(card('EMP-086')).toHaveAttribute('data-arriving', 'true')
    expect(card('EMP-094')).toHaveAttribute('data-arriving', 'true')
  })
})

describe('FrotaPage loading from the API (FRT-01..05)', () => {
  const user = {
    _id: 'u1',
    nome: 'Ana',
    role: 'admin',
    empresa: { _id: 'e1', nome: 'Acme' },
    escopo: 'empresa',
    filiais: [
      { _id: 'f1', nome: 'Filial 01', matriz: true },
      { _id: 'f2', nome: 'Filial 02', matriz: false },
    ],
  }
  const SwitchTo = ({ id }: { id: string }) => {
    const { setActiveBranch } = useActiveBranch()
    return <button onClick={() => setActiveBranch(id)}>switch to {id}</button>
  }
  const renderWithBranches = () =>
    render(
      <MemoryRouter>
        <ActiveBranchProvider>
          <SwitchTo id="f2" />
          <FrotaPage />
        </ActiveBranchProvider>
      </MemoryRouter>
    )
  const machine = (id: string, identificacao: string): Machine => ({ ...MACHINES[1], id, identificacao })
  const deferred = <T,>() => {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)))
    return { promise, resolve, reject }
  }

  beforeEach(() => localStorage.setItem('user', JSON.stringify(user)))
  afterEach(() => localStorage.clear())

  it('keeps the skeleton until both categories and machines answer', async () => {
    const categorias = deferred<Categoria[]>()
    const maquinas = deferred<Machine[]>()
    listarCategorias.mockReturnValue(categorias.promise)
    listarMaquinas.mockReturnValue(maquinas.promise)
    render(<FrotaPage />)

    await act(async () => maquinas.resolve(MACHINES))
    expect(screen.getByText('Carregando...')).toBeInTheDocument()
    await act(async () => categorias.resolve(CATEGORIAS))
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })

  it('requests the machines of the active branch', async () => {
    localStorage.setItem('liftech.activeBranch', 'f2')
    renderWithBranches()
    await screen.findAllByRole('region')
    expect(listarMaquinas).toHaveBeenCalledWith('f2')
    expect(listarCategorias).toHaveBeenCalledTimes(1)
  })

  it('fetches again on a branch switch and discards the old branch answer', async () => {
    const old = deferred<Machine[]>()
    listarMaquinas.mockReturnValueOnce(old.promise)
    listarMaquinas.mockResolvedValueOnce([machine('b2', 'EMP-099')])
    renderWithBranches()

    fireEvent.click(screen.getByText('switch to f2'))
    expect(await screen.findByText('EMP-099(ID)')).toBeInTheDocument()
    expect(listarMaquinas).toHaveBeenLastCalledWith('f2')

    await act(async () => old.resolve([machine('a1', 'EMP-001')]))
    expect(screen.queryByText('EMP-001(ID)')).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it.each([
    ['categories', () => listarCategorias.mockRejectedValueOnce(new Error('x'))],
    ['machines', () => listarMaquinas.mockRejectedValueOnce(new Error('x'))],
  ])('shows the error with retry when the %s request fails, and retry fetches again', async (_, fail) => {
    fail()
    render(<FrotaPage />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar as máquinas.')

    fireEvent.click(within(alert).getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findAllByRole('region')).toHaveLength(4)
    expect(listarCategorias).toHaveBeenCalledTimes(2)
    expect(listarMaquinas).toHaveBeenCalledTimes(2)
  })

  it('names a category by its translated key, or by its name when it has no key', async () => {
    listarCategorias.mockResolvedValue([
      { ...CATEGORIAS[1], nome: 'ignored' },
      { _id: 'c9', nome: 'Pátio', cor: '#FF7A3A', chave: null, statusVinculados: [] },
    ])
    await renderPage()
    expect(screen.getAllByRole('region').map((r) => r.getAttribute('aria-label'))).toEqual(['Ativas', 'Pátio'])
  })

  it('treats a machine whose category no longer exists as without category', async () => {
    listarMaquinas.mockResolvedValue([{ ...MACHINES[1], categoriaId: 'apagada' }])
    await renderPage()
    expect(screen.queryAllByRole('article')).toEqual([])
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    expect(pickerOptions()).toEqual([`${MACHINES[1].identificacao}(ID)`])
  })
})

describe('FrotaPage skeleton', () => {
  const pending = () => new Promise<never>(() => {})

  it('shows the kanban skeleton without toolbar while loading', () => {
    listarMaquinas.mockReturnValue(pending())
    render(<FrotaPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(screen.queryByRole('button', { name: 'Cadastrar categoria' })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('region')).toEqual([])
  })

  it('mirrors the toolbar with the page toolbar class, above 4 category panels', () => {
    listarMaquinas.mockReturnValue(pending())
    const { container } = render(<FrotaPage />)
    const toolbar = container.querySelector('[data-skeleton-toolbar]')!
    expect(toolbar).toHaveClass(styles.toolbar)
    expect(toolbar.children).toHaveLength(3)
    const rows = container.querySelectorAll('[data-skeleton-row]')
    expect(rows).toHaveLength(4)
    expect(toolbar.compareDocumentPosition(rows[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the board when not loading', async () => {
    await renderPage()
    expect(screen.queryByText('Carregando...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cadastrar categoria' })).toBeInTheDocument()
  })
})

describe('FrotaPage notifications', () => {
  const renderWithToasts = () =>
    renderPage(
      <ToastProvider>
        <FrotaPage />
      </ToastProvider>
    )
  const toastTexts = () =>
    within(screen.getByRole('status'))
      .queryAllByRole('listitem')
      .map((li) => li.textContent)

  it('announces a created category', async () => {
    await renderWithToasts()
    createCategory('Reserva')
    expect(toastTexts()).toEqual(['Categoria "Reserva" criada'])
  })

  it('announces a deleted category', async () => {
    await renderWithToasts()
    createCategory('Reserva')
    fireEvent.click(within(row('Reserva')).getByRole('button', { name: 'Excluir categoria' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))
    expect(toastTexts()).toContain('Categoria "Reserva" excluída')
  })

  it('announces machines added to a category', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(toastTexts()).toEqual(['Máquinas adicionadas a "Ativas"'])
  })

  it('announces a machine removed from its category', async () => {
    await renderWithToasts()
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(toastTexts()).toEqual(['EMP-082 removida da categoria'])
  })
})

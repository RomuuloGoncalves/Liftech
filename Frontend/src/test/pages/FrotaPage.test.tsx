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
import { sectorService, type Setor } from '../../services/sectorService'

vi.mock('../../services/machineService', () => ({
  machineService: { listar: vi.fn(), mover: vi.fn(), travar: vi.fn(), alterarStatus: vi.fn() },
}))
vi.mock('../../services/incidentService', () => ({
  incidentService: { listar: vi.fn().mockResolvedValue([]), reportar: vi.fn() },
}))
vi.mock('../../services/sectorService', () => ({ sectorService: { listar: vi.fn() } }))
vi.mock('../../services/categoryService', () => ({
  categoryService: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), remover: vi.fn() },
}))

const listarMaquinas = vi.mocked(machineService.listar)
const listarCategorias = vi.mocked(categoryService.listar)
const listarSetores = vi.mocked(sectorService.listar)
const SETORES: Setor[] = [
  { _id: 'sa', nome: 'Doca', filialId: 'f1', filial: { nome: 'Filial 01' } },
  { _id: 'sb', nome: 'Pátio', filialId: 'f1', filial: { nome: 'Filial 01' } },
]
const mover = vi.mocked(machineService.mover)
const travar = vi.mocked(machineService.travar)
const alterarStatus = vi.mocked(machineService.alterarStatus)
const criar = vi.mocked(categoryService.criar)
const atualizar = vi.mocked(categoryService.atualizar)
const remover = vi.mocked(categoryService.remover)
const session = (escopo: 'empresa' | 'filiais') =>
  localStorage.setItem('user', JSON.stringify({ _id: 'u1', nome: 'Ana', role: 'admin', escopo, filiais: [] }))

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
  listarSetores.mockReset()
  listarSetores.mockResolvedValue(SETORES)
  listarMaquinas.mockReset()
  listarCategorias.mockReset()
  listarMaquinas.mockResolvedValue(MACHINES)
  listarCategorias.mockResolvedValue(CATEGORIAS)
  vi.mocked(categoryService.criar).mockReset()
  vi.mocked(categoryService.atualizar).mockReset()
  vi.mocked(categoryService.remover).mockReset()
  criar.mockImplementation(async (dados) => ({ _id: `new-${dados.nome}`, chave: null, nome: '', cor: '', statusVinculados: [], ...dados }))
  atualizar.mockImplementation(async (id, dados) => ({ ...CATEGORIAS.find((c) => c._id === id)!, chave: null, ...dados }))
  remover.mockResolvedValue()
  session('empresa')
  for (const fn of [mover, travar, alterarStatus]) fn.mockReset()
  mover.mockResolvedValue([])
  travar.mockImplementation(async (id, categoriaTravada) => ({ ...MACHINES.find((m) => m.id === id)!, categoriaTravada }))
  alterarStatus.mockImplementation(async (id, status) => ({ ...MACHINES.find((m) => m.id === id)!, status }))
})

afterEach(() => localStorage.clear())

const renderPage = async (ui: React.ReactElement = <FrotaPage />) => {
  const view = render(ui)
  await screen.findByRole('searchbox', { name: 'Buscar' })
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

const createCategory = async (name: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Cadastrar categoria' }))
  fireEvent.change(screen.getByLabelText('Nome da categoria'), { target: { value: name } })
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Criar Categoria' })))
}
const confirmDelete = async (name: string) => {
  fireEvent.click(within(row(name)).getByRole('button', { name: 'Excluir categoria' }))
  await act(async () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' })))
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
    await createCategory('Reserva')
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
    await createCategory('ativas')
    expect(screen.getByText('Já existe uma categoria com esse nome')).toBeInTheDocument()
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })

  it('adds machines without category to a row through the picker', async () => {
    await renderPage()
    await createCategory('Reserva')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Reserva' }))
    expect(pickerOptions()).toEqual(['EMP-086(ID)', 'EMP-094(ID)'])
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(codesIn('Reserva')).toEqual(['EMP-086(ID)'])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes a created category after confirmation and frees its machines', async () => {
    await renderPage()
    await createCategory('Reserva')
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Reserva' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    fireEvent.click(within(row('Reserva')).getByRole('button', { name: 'Excluir categoria' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Reserva')
    await act(async () => fireEvent.click(within(dialog).getByRole('button', { name: 'Excluir' })))
    expect(remover).toHaveBeenCalledWith('new-Reserva')

    expect(queryRow('Reserva')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    expect(pickerOptions()).toContain('EMP-086(ID)')
  })

  it('keeps the category when the deletion is cancelled', async () => {
    await renderPage()
    await createCategory('Reserva')
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
    expect(within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Alterar status' })).toHaveValue('em_uso')
  })

  it('goes back to all categories when the filtered category is deleted', async () => {
    await renderPage()
    await createCategory('Reserva')
    const filter = screen.getByRole('combobox', { name: 'Filtrar categoria' })
    const reservaId = within(filter).getByRole('option', { name: 'Reserva' }).getAttribute('value')!
    fireEvent.change(filter, { target: { value: reservaId } })
    await confirmDelete('Reserva')
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
    expect(toolbar.children).toHaveLength(4)
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
    await createCategory('Reserva')
    expect(toastTexts()).toEqual(['Categoria "Reserva" criada'])
  })

  it('announces a deleted category', async () => {
    await renderWithToasts()
    await createCategory('Reserva')
    await confirmDelete('Reserva')
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

describe('FrotaPage category management by scope (FRT-06, FRT-07, CAT-04, CAT-05)', () => {
  it('lets the company scope create a category through the API with its linked status', async () => {
    await renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar categoria' }))
    fireEvent.change(screen.getByLabelText('Nome da categoria'), { target: { value: 'Pátio' } })
    fireEvent.click(screen.getByRole('checkbox', { name: /^Offline/ }))
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Criar Categoria' })))
    expect(criar).toHaveBeenCalledWith({ nome: 'Pátio', cor: '#3A9CFF', statusVinculados: ['offline'] })
    expect(screen.getAllByRole('region').at(-1)).toHaveAttribute('aria-label', 'Pátio')
  })

  it('keeps the form open when the API refuses the category', async () => {
    criar.mockRejectedValueOnce(new Error('409'))
    await renderPage()
    await createCategory('Pátio')
    expect(screen.getByRole('dialog', { name: 'Criar Categoria' })).toHaveTextContent('Não foi possível salvar')
    expect(queryRow('Pátio')).not.toBeInTheDocument()
  })

  it('edits a category with the status of the other categories disabled', async () => {
    await renderPage()
    fireEvent.click(within(row('Ativas')).getByRole('button', { name: 'Editar categoria' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar categoria' })
    expect(within(dialog).getByLabelText('Nome da categoria')).toHaveValue('Ativas')
    expect(within(dialog).getByRole('checkbox', { name: /^Em uso/ })).toBeChecked()
    expect(within(dialog).getByRole('checkbox', { name: /^Alerta/ })).toBeDisabled()

    fireEvent.change(within(dialog).getByLabelText('Nome da categoria'), { target: { value: 'Rodando' } })
    await act(async () => fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' })))
    expect(atualizar).toHaveBeenCalledWith('ativas', { nome: 'Rodando', cor: '#3A9CFF', statusVinculados: ['em_uso'] })
    expect(codesIn('Rodando')).toContain('EMP-082(ID)')
  })

  it('does not send the name when a keyed category keeps its translated name', async () => {
    await renderPage()
    fireEvent.click(within(row('Ativas')).getByRole('button', { name: 'Editar categoria' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /^Offline/ }))
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Salvar' })))
    expect(atualizar).toHaveBeenCalledWith('ativas', { cor: '#3A9CFF', statusVinculados: ['em_uso', 'offline'] })
  })

  it('deletes any category through the API and leaves its machines without category', async () => {
    await renderPage()
    await confirmDelete('Ativas')
    expect(remover).toHaveBeenCalledWith('ativas')
    expect(queryRow('Ativas')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Manutenção' }))
    expect(pickerOptions()).toContain('EMP-082(ID)')
  })

  it('keeps the category and warns when the deletion fails', async () => {
    remover.mockRejectedValueOnce(new Error('500'))
    render(
      <ToastProvider>
        <FrotaPage />
      </ToastProvider>
    )
    await screen.findAllByRole('region')
    await confirmDelete('Ativas')
    expect(row('Ativas')).toBeInTheDocument()
    expect(screen.getByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
  })

  it('hides create, edit and delete from the branches scope but keeps add, drag, move and lock', async () => {
    session('filiais')
    listarMaquinas.mockResolvedValue(MACHINES.map((m) => (m.identificacao === 'EMP-082' ? { ...m, categoriaTravada: true } : m)))
    await renderPage()
    expect(screen.queryByRole('button', { name: 'Cadastrar categoria' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adicionar categoria' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar categoria' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Excluir categoria' })).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' })).toBeInTheDocument()
    expect(within(card('EMP-082')).getByRole('button', { name: 'Destravar' })).toBeInTheDocument()
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    expect(codesIn('Manutenção')).toContain('EMP-082(ID)')
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(codesIn('Disponíveis')).toContain('EMP-082(ID)')
  })

  it('shows only the add-category buttons when the company has no categories', async () => {
    listarCategorias.mockResolvedValue([])
    await renderPage()
    expect(screen.queryAllByRole('region')).toEqual([])
    expect(screen.getByRole('button', { name: 'Adicionar categoria' })).toBeInTheDocument()
    expect(screen.queryByText('Nenhuma categoria cadastrada')).not.toBeInTheDocument()
  })

  it('shows "Nenhuma categoria cadastrada" to the branches scope when there are no categories', async () => {
    session('filiais')
    listarCategorias.mockResolvedValue([])
    await renderPage()
    expect(screen.getByText('Nenhuma categoria cadastrada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Adicionar categoria' })).not.toBeInTheDocument()
  })
})

describe('FrotaPage persists moves, locks and status (MOV-07, MOV-08, AUT-07, STS-10)', () => {
  const id = (code: string) => MACHINES.find((m) => m.identificacao === code)!.id
  const never = () => new Promise<never>(() => {})
  const renderWithToasts = () =>
    renderPage(
      <ToastProvider>
        <FrotaPage />
      </ToastProvider>
    )
  const openDetail = (code: string) => fireEvent.click(within(card(code)).getByRole('button', { name: /Ver detalhes/ }))
  const statusSelect = () => within(screen.getByRole('dialog')).getByRole('combobox', { name: 'Alterar status' })

  it('moves a dragged card at once and saves it', async () => {
    mover.mockReturnValue(never())
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Manutenção'))
    expect(codesIn('Manutenção')).toContain('EMP-082(ID)')
    expect(mover).toHaveBeenCalledWith([id('EMP-082')], 'manutencao')
  })

  it('does not call the API when a card is dropped on its own row', async () => {
    await renderPage()
    fireEvent.dragStart(card('EMP-082'))
    fireEvent.drop(row('Ativas'))
    expect(mover).not.toHaveBeenCalled()
  })

  it('saves "Mover para", "Remover da categoria" and "Adicionar máquinas" with the right ids', async () => {
    await renderPage()
    openMenu('EMP-082')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Disponíveis' }))
    expect(mover).toHaveBeenLastCalledWith([id('EMP-082')], 'disponiveis')

    openMenu('EMP-083')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Remover da categoria' }))
    expect(mover).toHaveBeenLastCalledWith([id('EMP-083')], null)

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-094(ID)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(mover).toHaveBeenLastCalledWith([id('EMP-086'), id('EMP-094')], 'ativas')
  })

  it('puts the card back and warns when a move fails', async () => {
    mover.mockRejectedValue(new Error('500'))
    await renderWithToasts()
    fireEvent.dragStart(card('EMP-082'))
    await act(async () => fireEvent.drop(row('Manutenção')))
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
    expect(codesIn('Manutenção')).not.toContain('EMP-082(ID)')
    expect(screen.getByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
  })

  it('puts the machines back without category when adding fails', async () => {
    mover.mockRejectedValue(new Error('500'))
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar máquinas em Ativas' }))
    fireEvent.click(screen.getByRole('option', { name: 'EMP-086(ID)' }))
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar' })))
    expect(codesIn('Ativas')).not.toContain('EMP-086(ID)')
    expect(screen.getByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
  })

  it('unlocks from the card padlock at once and saves it, rolling back on failure', async () => {
    listarMaquinas.mockResolvedValue(MACHINES.map((m) => (m.identificacao === 'EMP-082' ? { ...m, categoriaTravada: true } : m)))
    travar.mockRejectedValue(new Error('500'))
    await renderWithToasts()
    fireEvent.click(within(card('EMP-082')).getByRole('button', { name: 'Destravar' }))
    expect(within(card('EMP-082')).queryByRole('button', { name: 'Destravar' })).not.toBeInTheDocument()
    expect(travar).toHaveBeenCalledWith(id('EMP-082'), false)
    await act(async () => {})
    expect(within(card('EMP-082')).getByRole('button', { name: 'Destravar' })).toBeInTheDocument()
    expect(screen.getByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
  })

  it('locks from the detail and shows the padlock on the card', async () => {
    await renderPage()
    openDetail('EMP-082')
    await act(async () => fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Travar' })))
    expect(travar).toHaveBeenCalledWith(id('EMP-082'), true)
    expect(within(row('Ativas')).getByRole('button', { name: 'Destravar' })).toBeInTheDocument()
  })

  it('changes the status from the detail at once and follows the category the API returns', async () => {
    let resolve!: (m: Machine) => void
    alterarStatus.mockReturnValue(new Promise<Machine>((r) => (resolve = r)))
    await renderPage()
    openDetail('EMP-082')
    fireEvent.change(statusSelect(), { target: { value: 'manutencao' } })
    expect(alterarStatus).toHaveBeenCalledWith(id('EMP-082'), 'manutencao')
    expect(statusSelect()).toHaveValue('manutencao')
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')

    const machine = MACHINES.find((m) => m.identificacao === 'EMP-082')!
    await act(async () => resolve({ ...machine, status: 'manutencao', categoriaId: 'manutencao' }))
    expect(codesIn('Manutenção')).toContain('EMP-082(ID)')
    expect(codesIn('Ativas')).not.toContain('EMP-082(ID)')
  })

  it('keeps the card in place when the API keeps the category on a status change', async () => {
    await renderPage()
    openDetail('EMP-082')
    await act(async () => fireEvent.change(statusSelect(), { target: { value: 'offline' } }))
    expect(codesIn('Ativas')).toContain('EMP-082(ID)')
  })

  it('restores the status and warns when the status change fails', async () => {
    alterarStatus.mockRejectedValue(new Error('500'))
    await renderWithToasts()
    openDetail('EMP-082')
    await act(async () => fireEvent.change(statusSelect(), { target: { value: 'manutencao' } }))
    expect(statusSelect()).toHaveValue('em_uso')
    expect(screen.getByText('Não foi possível salvar. Tente novamente.')).toBeInTheDocument()
  })
})

describe('FrotaPage: sector filter', () => {
  const SETOR_DE: Record<string, string> = { 'EMP-083': 'sa', 'EMP-091': 'sa', 'EMP-081': 'sa', 'EMP-088': 'sb' }
  const linked = MACHINES.map((m) => ({ ...m, setorId: SETOR_DE[m.identificacao] ?? null }))
  const sectorFilter = () => screen.getByRole('combobox', { name: 'Filtrar por setor' })
  const optionTexts = () => [...sectorFilter().querySelectorAll('option')].map((o) => o.textContent)
  const pick = (value: string) => fireEvent.change(sectorFilter(), { target: { value } })

  beforeEach(() => listarMaquinas.mockResolvedValue(linked))

  it('shows "Todos os setores" and the sectors of the active branch', async () => {
    await renderPage()

    expect(listarSetores).toHaveBeenCalledWith(undefined)
    expect(sectorFilter()).toHaveValue('Todos')
    expect(optionTexts()).toEqual(['Todos os setores', 'Doca', 'Pátio'])
  })

  it('shows in each row only the machines of the chosen sector', async () => {
    await renderPage()
    const allAvailable = codesIn('Disponíveis')

    pick('sa')
    expect(codesIn('Disponíveis')).toEqual(allAvailable.filter((c) => ['EMP-083(ID)', 'EMP-091(ID)'].includes(c!)))
    expect(codesIn('Acidentes')).toEqual(['EMP-081(ID)'])
    expect(codesIn('Ativas')).toEqual([])
  })

  it('combines the sector with the text search', async () => {
    await renderPage()

    pick('sa')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar' }), { target: { value: '091' } })
    expect(codesIn('Disponíveis')).toEqual(['EMP-091(ID)'])
    expect(codesIn('Acidentes')).toEqual([])
  })

  it('stops filtering by sector with "Todos os setores"', async () => {
    await renderPage()
    const before = codesIn('Disponíveis')

    pick('sb')
    expect(codesIn('Disponíveis')).toEqual(['EMP-088(ID)'])
    pick('Todos')
    expect(codesIn('Disponíveis')).toEqual(before)
  })

  it('keeps the page working with an empty filter when the sectors fail to load', async () => {
    listarSetores.mockRejectedValue(new Error('Network Error'))
    await renderPage()

    expect(optionTexts()).toEqual(['Todos os setores'])
    expect(screen.getAllByRole('region')).toHaveLength(4)
  })

  describe('with branches', () => {
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
      renderPage(
        <MemoryRouter>
          <ActiveBranchProvider>
            <SwitchTo id="f2" />
            <FrotaPage />
          </ActiveBranchProvider>
        </MemoryRouter>
      )

    beforeEach(() => localStorage.setItem('user', JSON.stringify(user)))

    it('names the branch in each option when every branch is on screen', async () => {
      await renderWithBranches()

      expect(optionTexts()).toEqual(['Todos os setores', 'Doca · Filial 01', 'Pátio · Filial 01'])
    })

    it('requests the sectors of the new branch and goes back to "Todos os setores" when it changes', async () => {
      await renderWithBranches()
      pick('sb')
      expect(codesIn('Disponíveis')).toEqual(['EMP-088(ID)'])

      fireEvent.click(screen.getByText('switch to f2'))
      await screen.findByRole('searchbox', { name: 'Buscar' })

      expect(listarSetores).toHaveBeenLastCalledWith('f2')
      expect(sectorFilter()).toHaveValue('Todos')
      expect(optionTexts()).toEqual(['Todos os setores', 'Doca', 'Pátio'])
      expect(codesIn('Disponíveis').length).toBeGreaterThan(1)
    })
  })
})

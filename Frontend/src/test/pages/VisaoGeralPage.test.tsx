import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../components/common/Toast'
import { ActiveBranchProvider, useActiveBranch } from '../../context/ActiveBranchContext'
import i18n from '../../config/i18n'
import VisaoGeralPage from '../../pages/VisaoGeralPage'
import styles from '../../pages/VisaoGeralPage.module.css'
import { machineService } from '../../services/machineService'
import { sectorService, type Setor } from '../../services/sectorService'
import type { NewMachineFormValues } from '../../components/machines/NewMachinePanel'
import { DEFAULT_PERIOD, MACHINES, eventsForMachine, filterEvents, type Machine } from '../../data/machines'

vi.mock('../../services/machineService', () => ({
  machineService: { listar: vi.fn(), alterarStatus: vi.fn(), travar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), remover: vi.fn() },
}))
vi.mock('../../services/sectorService', () => ({ sectorService: { listar: vi.fn() } }))
vi.mock('../../services/incidentService', () => ({
  incidentService: { listar: vi.fn().mockResolvedValue([]), reportar: vi.fn() },
}))

const listar = vi.mocked(machineService.listar)
const criar = vi.mocked(machineService.criar)
const atualizar = vi.mocked(machineService.atualizar)
const remover = vi.mocked(machineService.remover)
const listarSetores = vi.mocked(sectorService.listar)

const SECTORS: Setor[] = [
  { _id: 'sd', nome: 'Doca Nova', filialId: 'f1', filial: { nome: 'Filial 01' } },
  { _id: 'se', nome: 'Expedição - Bloco B', filialId: 'f1', filial: { nome: 'Filial 01' } },
]

// What the API answers by default: the machine as sent, with a server id.
const savedFrom = (values: NewMachineFormValues, base: Partial<Machine> = {}): Machine =>
  ({
    status: 'disponivel',
    categoriaId: null,
    categoriaTravada: false,
    alertaEm: null,
    tempoSessaoMinutos: 0,
    ...base,
    id: base.id ?? `srv-${values.identificacao}`,
    nome: values.nome,
    identificacao: values.identificacao,
    setor: SECTORS.find((sector) => sector._id === values.setorId)?.nome ?? '',
    setorId: values.setorId || null,
    dispositivoConectado: { enderecoMac: values.enderecoMac, nomeDispositivo: values.nomeDispositivo },
  }) as Machine

beforeEach(() => {
  listarSetores.mockReset()
  listarSetores.mockResolvedValue(SECTORS)
  listar.mockReset()
  listar.mockResolvedValue(MACHINES)
  criar.mockReset()
  criar.mockImplementation(async (values) => savedFrom(values))
  atualizar.mockReset()
  atualizar.mockImplementation(async (id, values) => savedFrom(values, MACHINES.find((m) => m.id === id) ?? { id }))
  remover.mockReset()
  remover.mockResolvedValue(undefined)
})

const renderLoaded = async () => {
  const view = render(<VisaoGeralPage />)
  await screen.findAllByRole('article')
  return view
}

describe('VisaoGeralPage', () => {
  it('renders one card per machine in the mock dataset', async () => {
    await renderLoaded()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('renders the Cadastrar Máquina button and the search field', async () => {
    await renderLoaded()
    expect(screen.getByRole('button', { name: /cadastrar máquina/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('filters cards by identificação/setor as the user types in the search field', async () => {
    await renderLoaded()
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'EMP-084' } })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
  })

  it('shows all machines again after the search field is cleared', async () => {
    await renderLoaded()
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'EMP-084' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)

    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('keeps the active status filter applied after the search field is cleared', async () => {
    await renderLoaded()
    const search = screen.getByPlaceholderText('Search...')
    const select = screen.getByRole('combobox', { name: /filtrar máquinas por status/i })

    fireEvent.change(select, { target: { value: 'manutencao' } })
    fireEvent.change(search, { target: { value: 'EMP-084' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)

    fireEvent.change(search, { target: { value: '' } })

    const expectedCount = MACHINES.filter(
      (machine) => machine.status === 'manutencao'
    ).length
    expect(screen.getAllByRole('article')).toHaveLength(expectedCount)
  })

  it('lists the 5 status codes in the filter and filters by alerta', async () => {
    await renderLoaded()
    const select = screen.getByRole('combobox', { name: /filtrar máquinas por status/i })
    const values = within(select).getAllByRole('option').map((option) => (option as HTMLOptionElement).value)
    expect(values).toEqual(['Todos', 'disponivel', 'em_uso', 'manutencao', 'alerta', 'offline'])

    fireEvent.change(select, { target: { value: 'alerta' } })
    expect(screen.getAllByRole('article').map((card) => within(card).getByText(/EMP-/).textContent)).toEqual([
      'EMP-081(ID)',
      'EMP-085(ID)',
      'EMP-089(ID)',
    ])
  })

  it('filters cards by status when a status is selected in the filter', async () => {
    await renderLoaded()
    const select = screen.getByRole('combobox', { name: /filtrar máquinas por status/i })

    fireEvent.change(select, { target: { value: 'manutencao' } })

    const expectedCount = MACHINES.filter(
      (machine) => machine.status === 'manutencao'
    ).length
    expect(screen.getAllByRole('article')).toHaveLength(expectedCount)
  })

  it('shows the empty state message when search + filter match nothing', async () => {
    await renderLoaded()
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'inexistente-xyz' } })

    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
  })

  it('opens the Nova Máquina panel when Cadastrar Máquina is clicked', async () => {
    await renderLoaded()
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))
    expect(screen.getByRole('dialog', { name: 'Nova Máquina' })).toBeInTheDocument()
  })

  it('adds a new card to the grid with status Disponível and 0 minutos after a successful submit, and closes the panel', async () => {
    await renderLoaded()
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Nova' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-999' } })
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(screen.queryByRole('dialog', { name: 'Nova Máquina' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length + 1)
    const newCard = screen.getByText('EMP-999(ID)').closest('article') as HTMLElement
    expect(newCard).not.toBeNull()
    expect(within(newCard).getByText('Disponível')).toBeInTheDocument()
    expect(within(newCard).getByText('0 minutos')).toBeInTheDocument()
  })

  it('does not add a card and closes the panel when Cancelar is clicked', async () => {
    await renderLoaded()
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Descartada' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog', { name: 'Nova Máquina' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('keeps the active search and status filter after opening and closing the panel', async () => {
    await renderLoaded()
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
  it('opens the detail modal with the machine data when a card is clicked', async () => {
    await renderLoaded()

    openDetail('EMP-084')
    const dialog = screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })
    expect(within(dialog).getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(within(dialog).getByText('Nome Dispositivo')).toBeInTheDocument()
    expect(within(dialog).getByRole('tab', { name: 'Acidentes' })).toHaveAttribute('aria-selected', 'true')
  })

  it('closes the detail modal with Escape', async () => {
    await renderLoaded()

    openDetail('EMP-084')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('edits the machine: the drawer opens filled in and the card shows the new setor', async () => {
    await renderLoaded()

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    expect(screen.getByRole('dialog', { name: 'Editar Máquina' })).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toHaveValue('EMP-084')
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'sd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))

    const card = cardOf('EMP-084')
    expect(within(card).getByText('Doca Nova')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getByText('Doca Nova')).toBeInTheDocument()
  })

  it('keeps the machine unchanged when the edit is cancelled', async () => {
    await renderLoaded()

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'sd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    const card = cardOf('EMP-084')
    expect(within(card).queryByText('Doca Nova')).not.toBeInTheDocument()
  })

  it('keeps the active search after editing', async () => {
    await renderLoaded()

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'emp-084' } })
    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'sd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByRole('searchbox')).toHaveValue('emp-084')
  })

  it('deletes the machine after confirming, closing every dialog', async () => {
    await renderLoaded()

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    expect(screen.getByRole('dialog', { name: 'Excluir máquina' })).toBeInTheDocument()
    expect(screen.getByText(/Excluir Empilhadeira Elétrica Titan-X \(EMP-084\)\?/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('EMP-084(ID)')).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length - 1)
  })

  it('keeps the machine and returns to the detail modal when the delete is cancelled', async () => {
    await renderLoaded()

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('does not open the detail when the menu button of a card is clicked', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: /mais ações para emp-084/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows an empty history for a machine created in the UI', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova Empilhadeira' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-200' } })
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    openDetail('EMP-200')

    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })
})

describe('VisaoGeralPage skeleton', () => {
  it('shows the grid skeleton without toolbar while the request is pending', () => {
    listar.mockReturnValue(new Promise(() => {}))
    const { container } = render(<VisaoGeralPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(container.querySelectorAll('[data-skeleton-card]')).toHaveLength(8)
    expect(screen.queryByRole('button', { name: /cadastrar máquina/i })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toEqual([])
  })

  it('mirrors the toolbar (search, status and sector selects, button) above the page grid class while the request is pending', () => {
    listar.mockReturnValue(new Promise(() => {}))
    const { container } = render(<VisaoGeralPage />)
    const toolbar = container.querySelector('[data-skeleton-toolbar]')!
    expect(toolbar).toHaveClass(styles.toolbar)
    expect(toolbar.children).toHaveLength(4)
    const grid = container.querySelector(`.${styles.grid}`)!
    expect(grid.querySelectorAll('[data-skeleton-card]')).toHaveLength(8)
    expect(toolbar.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('VisaoGeralPage notifications', () => {
  const renderWithToasts = async () => {
    render(
      <ToastProvider>
        <VisaoGeralPage />
      </ToastProvider>
    )
    await screen.findAllByRole('article')
  }
  const toastTexts = () =>
    within(screen.getByRole('status'))
      .queryAllByRole('listitem')
      .map((li) => li.textContent)
  const open = (code: string) =>
    fireEvent.click(
      within(screen.getByText(`${code}(ID)`).closest('article') as HTMLElement).getByRole('button', { name: /Ver detalhes/ })
    )

  it('announces a registered machine', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Nova' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-999' } })
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(toastTexts()).toEqual(['Máquina "EMP-999" cadastrada'])
  })

  it('announces a saved machine', async () => {
    await renderWithToasts()
    open('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'sd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))
    expect(toastTexts()).toEqual(['Máquina "EMP-084" salva'])
  })

  it('announces a deleted machine', async () => {
    await renderWithToasts()
    open('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(toastTexts()).toEqual(['Máquina "EMP-084" excluída'])
  })
})

const apiMachine = (over: Partial<Machine> = {}): Machine => ({
  id: '66f0c0ffee0000000000a001',
  identificacao: 'EMP-084',
  nome: 'Empilhadeira Elétrica Titan-X',
  setor: 'Expedição - Bloco B',
  setorId: null,
  status: 'manutencao', categoriaId: null, categoriaTravada: false, dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:FA' },
  tempoSessaoMinutos: 5,
  ...over,
})

describe('VisaoGeralPage: API', () => {
  it('requests the machines once on open and renders one card per machine returned', async () => {
    listar.mockResolvedValue([
      apiMachine(),
      apiMachine({ id: '66f0c0ffee0000000000a002', identificacao: 'EMP-085', nome: 'Empilhadeira a Combustão Atlas-S' }),
    ])

    render(<VisaoGeralPage />)

    expect(await screen.findAllByRole('article')).toHaveLength(2)
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(screen.getByText('EMP-085(ID)')).toBeInTheDocument()
    expect(listar).toHaveBeenCalledTimes(1)
  })

  it('shows the load error message and the retry button when the request fails', async () => {
    listar.mockRejectedValue(new Error('Network Error'))

    render(<VisaoGeralPage />)

    expect(await screen.findByText('Não foi possível carregar as máquinas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toEqual([])
  })

  it('requests again when "Tentar novamente" is clicked, going back to the skeleton and then to the cards', async () => {
    listar.mockRejectedValueOnce(new Error('Network Error'))
    let resolve!: (machines: Machine[]) => void
    listar.mockReturnValueOnce(new Promise<Machine[]>((r) => (resolve = r)))

    const { container } = render(<VisaoGeralPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(listar).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.queryByText('Não foi possível carregar as máquinas.')).not.toBeInTheDocument()

    resolve([apiMachine()])
    expect(await screen.findAllByRole('article')).toHaveLength(1)
  })

  it('shows the empty state when the API returns no machines', async () => {
    listar.mockResolvedValue([])

    render(<VisaoGeralPage />)

    expect(await screen.findByText('Nenhuma máquina encontrada')).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toEqual([])
  })

  it('registers, edits and deletes through the API without requesting the list again', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova Empilhadeira' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-200' } })
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    const created = { nome: 'Nova Empilhadeira', identificacao: 'EMP-200', setorId: '', nomeDispositivo: '', enderecoMac: 'AA:BB:CC:DD:EE' }
    expect(criar).toHaveBeenCalledWith(created, undefined)
    await screen.findByText('EMP-200(ID)')

    openDetail('EMP-200')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'sd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))
    expect(atualizar).toHaveBeenCalledWith('srv-EMP-200', { ...created, setorId: 'sd' })

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(remover).toHaveBeenCalledWith('srv-EMP-200')

    await waitFor(() => expect(screen.queryByText('EMP-200(ID)')).not.toBeInTheDocument())
    expect(listar).toHaveBeenCalledTimes(1)
  })

  it('detail repairs show the mock events of the machine with the same identificacao, even with an API id', async () => {
    const listItemsInDetail = async (machine: Machine) => {
      listar.mockResolvedValue([machine])
      const { unmount } = render(<VisaoGeralPage />)
      await screen.findAllByRole('article')
      openDetail(machine.identificacao)
      fireEvent.click(screen.getByRole('tab', { name: 'Manutenção' }))
      const count = within(screen.getByRole('dialog')).getAllByRole('listitem').length
      unmount()
      return count
    }

    const withMockHistory = await listItemsInDetail(apiMachine())
    const withoutHistory = await listItemsInDetail(apiMachine({ identificacao: 'EMP-777' }))

    const expectedEvents = filterEvents(eventsForMachine('4'), { tipo: 'manutencao', ...DEFAULT_PERIOD }).length
    expect(expectedEvents).toBeGreaterThan(0)
    expect(withMockHistory - withoutHistory).toBe(expectedEvents)
  })

  it('detail history is empty for a machine whose identificacao is not in the mock', async () => {
    listar.mockResolvedValue([apiMachine({ identificacao: 'EMP-777' })])

    render(<VisaoGeralPage />)
    await screen.findAllByRole('article')
    openDetail('EMP-777')

    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows a machine with an unknown status under "Todos" and hides it under another status filter', async () => {
    listar.mockResolvedValue([apiMachine({ status: 'Desconhecido' as never, categoriaId: null, categoriaTravada: false, dispositivoConectado: { enderecoMac: 'X' } })])

    render(<VisaoGeralPage />)

    expect(await screen.findAllByRole('article')).toHaveLength(1)
    fireEvent.change(screen.getByRole('combobox', { name: /filtrar máquinas por status/i }), { target: { value: 'manutencao' } })
    expect(screen.queryAllByRole('article')).toEqual([])
  })

  it('shows the error message and the retry button in English when the language is en-US', async () => {
    await i18n.changeLanguage('en-US')
    listar.mockRejectedValue(new Error('Network Error'))

    render(<VisaoGeralPage />)

    expect(await screen.findByText('Could not load the machines.')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument())
  })
})

describe('VisaoGeralPage: active branch', () => {
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
          <SwitchTo id="todas" />
          <VisaoGeralPage />
        </ActiveBranchProvider>
      </MemoryRouter>
    )

  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify(user))
  })

  it('requests without a branch when the active branch is todas', async () => {
    listar.mockResolvedValue([apiMachine()])

    renderWithBranches()

    await screen.findAllByRole('article')
    expect(listar).toHaveBeenCalledTimes(1)
    expect(listar).toHaveBeenCalledWith(undefined)
  })

  it('requests with the id of the stored active branch', async () => {
    localStorage.setItem('liftech.activeBranch', 'f2')
    listar.mockResolvedValue([apiMachine()])

    renderWithBranches()

    await screen.findAllByRole('article')
    expect(listar).toHaveBeenCalledTimes(1)
    expect(listar).toHaveBeenCalledWith('f2')
  })

  it('goes back to the skeleton and requests again with the new branch when the active branch changes', async () => {
    listar.mockResolvedValueOnce([apiMachine()])
    let resolve!: (machines: Machine[]) => void
    listar.mockReturnValueOnce(new Promise<Machine[]>((r) => (resolve = r)))

    const { container } = renderWithBranches()
    await screen.findAllByRole('article')

    fireEvent.click(screen.getByText('switch to f2'))

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(listar).toHaveBeenLastCalledWith('f2')
    expect(listar).toHaveBeenCalledTimes(2)

    resolve([apiMachine({ id: 'b2', identificacao: 'EMP-099' })])
    expect(await screen.findByText('EMP-099(ID)')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('discards the answer of a previous branch that arrives after the switch', async () => {
    let resolveOld!: (machines: Machine[]) => void
    listar.mockReturnValueOnce(new Promise<Machine[]>((r) => (resolveOld = r)))
    listar.mockResolvedValueOnce([apiMachine({ id: 'b2', identificacao: 'EMP-099' })])

    renderWithBranches()
    fireEvent.click(screen.getByText('switch to f2'))
    expect(await screen.findByText('EMP-099(ID)')).toBeInTheDocument()

    await act(async () => {
      resolveOld([apiMachine({ id: 'a1', identificacao: 'EMP-001' }), apiMachine({ id: 'a2', identificacao: 'EMP-002' })])
    })

    expect(screen.queryByText('EMP-001(ID)')).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('ignores a failure of a previous branch that arrives after the switch', async () => {
    let rejectOld!: (error: Error) => void
    listar.mockReturnValueOnce(new Promise<Machine[]>((_, r) => (rejectOld = r)))
    listar.mockResolvedValueOnce([apiMachine({ id: 'b2', identificacao: 'EMP-099' })])

    renderWithBranches()
    fireEvent.click(screen.getByText('switch to f2'))
    expect(await screen.findByText('EMP-099(ID)')).toBeInTheDocument()

    await act(async () => {
      rejectOld(new Error('Network Error'))
    })

    expect(screen.queryByRole('button', { name: 'Tentar novamente' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('retries with the active branch after a failure', async () => {
    localStorage.setItem('liftech.activeBranch', 'f2')
    listar.mockRejectedValueOnce(new Error('Network Error'))
    listar.mockResolvedValueOnce([apiMachine()])

    renderWithBranches()
    fireEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    await screen.findAllByRole('article')
    expect(listar).toHaveBeenCalledTimes(2)
    expect(listar).toHaveBeenLastCalledWith('f2')
  })
})

describe('VisaoGeralPage status and lock', () => {
  const card = () =>
    screen.getAllByRole('article').find((el) => within(el).queryByText('EMP-084(ID)')) as HTMLElement
  const base = MACHINES.find((m) => m.identificacao === 'EMP-084') as Machine
  const renderOpen = async () => {
    render(
      <ToastProvider>
        <VisaoGeralPage />
      </ToastProvider>
    )
    await screen.findAllByRole('article')
    fireEvent.click(within(card()).getByRole('button', { name: /Ver detalhes/ }))
  }

  it('updates the card badge after a status change', async () => {
    vi.mocked(machineService.alterarStatus).mockResolvedValue({ ...base, status: 'offline' })
    await renderOpen()
    fireEvent.change(screen.getByLabelText('Alterar status'), { target: { value: 'disponivel' } })
    expect(within(card()).getByText('Disponível')).toBeInTheDocument()
    expect(machineService.alterarStatus).toHaveBeenCalledWith(base.id, 'disponivel')
    expect(await within(card()).findByText('Offline')).toBeInTheDocument()
  })

  it('restores the badge and warns when the change fails', async () => {
    vi.mocked(machineService.alterarStatus).mockRejectedValue(new Error('x'))
    await renderOpen()
    fireEvent.change(screen.getByLabelText('Alterar status'), { target: { value: 'disponivel' } })
    expect(await within(card()).findByText('Em manutenção')).toBeInTheDocument()
    expect(within(screen.getByRole('status')).getByText(i18n.t('fleet.saveError'))).toBeInTheDocument()
  })

  it('applies the lock returned by the service', async () => {
    vi.mocked(machineService.travar).mockResolvedValue({ ...base, categoriaTravada: true })
    await renderOpen()
    fireEvent.click(screen.getByRole('button', { name: 'Travar' }))
    expect(machineService.travar).toHaveBeenCalledWith(base.id, true)
    expect(await screen.findByRole('button', { name: 'Destravar' })).toBeInTheDocument()
  })
})

describe('VisaoGeralPage: saving through the API', () => {
  const renderWithToasts = async () => {
    render(
      <ToastProvider>
        <VisaoGeralPage />
      </ToastProvider>
    )
    await screen.findAllByRole('article')
  }
  const toastTexts = () =>
    within(screen.getByRole('status'))
      .queryAllByRole('listitem')
      .map((li) => li.textContent)
  const register = () => {
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Nova' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-999' } })
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
  }
  const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status } })
  const SAVE_ERROR = 'Não foi possível salvar a máquina. Tente novamente.'

  it('shows the new card before the API answers and swaps it for the answer', async () => {
    let resolve!: (machine: Machine) => void
    criar.mockReturnValue(new Promise<Machine>((r) => (resolve = r)))
    await renderWithToasts()

    register()
    expect(within(cardOf('EMP-999')).getByText('Disponível')).toBeInTheDocument()

    await act(async () => {
      resolve({ ...apiMachine({ id: 'srv-1', identificacao: 'EMP-999', setor: 'Doca do servidor' }) })
    })

    expect(within(cardOf('EMP-999')).getByText('Doca do servidor')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length + 1)
  })

  it('removes the new card and shows an error toast when the API refuses it', async () => {
    criar.mockRejectedValue(httpError(409))
    await renderWithToasts()

    register()

    await waitFor(() => expect(screen.queryByText('EMP-999(ID)')).not.toBeInTheDocument())
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
    expect(toastTexts()).toContain(SAVE_ERROR)
  })

  it('puts the previous values back and shows an error toast when the edit fails', async () => {
    atualizar.mockRejectedValue(httpError(500))
    await renderWithToasts()

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'sd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))

    await waitFor(() => expect(within(cardOf('EMP-084')).queryByText('Doca Nova')).not.toBeInTheDocument())
    expect(within(cardOf('EMP-084')).getByText('Expedição - Bloco B')).toBeInTheDocument()
    expect(toastTexts()).toContain(SAVE_ERROR)
  })

  it('brings the machine back with the open-session toast when the delete answers 409', async () => {
    remover.mockRejectedValue(httpError(409))
    await renderWithToasts()

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(screen.queryByText('EMP-084(ID)')).not.toBeInTheDocument()

    expect(await screen.findByText('EMP-084(ID)')).toBeInTheDocument()
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
    expect(toastTexts()).toContain('Máquina com sessão aberta: encerre a sessão antes de excluir.')
  })

  it('brings the machine back with the generic error toast when the delete fails otherwise', async () => {
    remover.mockRejectedValue(new Error('Network Error'))
    await renderWithToasts()

    openDetail('EMP-084')
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByText('EMP-084(ID)')).toBeInTheDocument()
    expect(toastTexts()).toContain(SAVE_ERROR)
  })
})

describe('VisaoGeralPage: branch on register', () => {
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
  const renderWithBranches = async () => {
    render(
      <MemoryRouter>
        <ActiveBranchProvider>
          <VisaoGeralPage />
        </ActiveBranchProvider>
      </MemoryRouter>
    )
    await screen.findAllByRole('article')
    fireEvent.click(screen.getByRole('button', { name: /cadastrar máquina/i }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Empilhadeira Nova' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-999' } })
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
  }

  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.removeItem('liftech.activeBranch')
  })

  it('with "todas" and two branches the panel asks for the branch and sends the chosen one', async () => {
    await renderWithBranches()

    expect(screen.getByLabelText('Filial')).toHaveValue('f1')
    fireEvent.change(screen.getByLabelText('Filial'), { target: { value: 'f2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(criar).toHaveBeenCalledWith(expect.objectContaining({ identificacao: 'EMP-999', filialId: 'f2' }), 'f2')
  })

  it('with an active branch the panel has no Filial field and registers in the active branch', async () => {
    localStorage.setItem('liftech.activeBranch', 'f2')
    await renderWithBranches()

    expect(screen.queryByLabelText('Filial')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(criar).toHaveBeenCalledWith(expect.not.objectContaining({ filialId: expect.anything() }), 'f2')
  })
})

describe('VisaoGeralPage: sectors in the machine form', () => {
  const sectorOptions = () =>
    [...screen.getByLabelText('Setor').querySelectorAll('option')].map((o) => o.textContent)

  it('requests the sectors with the machines and offers them in the register form', async () => {
    await renderLoaded()

    expect(listarSetores).toHaveBeenCalledWith(undefined)
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }))
    expect(sectorOptions()).toEqual(['Sem setor', 'Doca Nova', 'Expedição - Bloco B'])
  })

  it('still lists the machines when the sectors fail, with only "Sem setor" in the form', async () => {
    listarSetores.mockRejectedValue(new Error('Network Error'))
    await renderLoaded()

    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }))
    expect(sectorOptions()).toEqual(['Sem setor'])
  })

  it('shows the picked sector name on the new card before the API answers', async () => {
    criar.mockReturnValue(new Promise<Machine>(() => {}))
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }))
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova' } })
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-300' } })
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'sd' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(criar).toHaveBeenCalledWith(expect.objectContaining({ setorId: 'sd' }), undefined)
    expect(within(cardOf('EMP-300')).getByText('Doca Nova')).toBeInTheDocument()
  })
})

describe('VisaoGeralPage: sector filter', () => {
  const linked = [
    apiMachine({ id: 'a', identificacao: 'EMP-001', setorId: 'sd', setor: 'Doca Nova', status: 'disponivel' }),
    apiMachine({ id: 'b', identificacao: 'EMP-002', setorId: 'se', setor: 'Expedição - Bloco B', status: 'disponivel' }),
    apiMachine({ id: 'c', identificacao: 'EMP-003', setorId: 'sd', setor: 'Doca Nova', status: 'manutencao' }),
    apiMachine({ id: 'd', identificacao: 'EMP-004', setorId: null, setor: '', status: 'disponivel' }),
  ]
  const sectorFilter = () => screen.getByRole('combobox', { name: 'Filtrar por setor' })
  const codes = () => screen.queryAllByText(/\(ID\)$/).map((el) => el.textContent)

  it('shows "Todos os setores" and the sectors of the active branch', async () => {
    await renderLoaded()

    expect(sectorFilter()).toHaveValue('Todos')
    expect([...sectorFilter().querySelectorAll('option')].map((o) => o.textContent)).toEqual([
      'Todos os setores',
      'Doca Nova',
      'Expedição - Bloco B',
    ])
  })

  it('shows only the machines of the chosen sector, together with the status filter', async () => {
    listar.mockResolvedValue(linked)
    await renderLoaded()

    fireEvent.change(sectorFilter(), { target: { value: 'sd' } })
    expect(codes()).toEqual(['EMP-001(ID)', 'EMP-003(ID)'])

    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar máquinas por status' }), { target: { value: 'manutencao' } })
    expect(codes()).toEqual(['EMP-003(ID)'])
  })

  it('stops filtering by sector when "Todos os setores" is chosen', async () => {
    listar.mockResolvedValue(linked)
    await renderLoaded()

    fireEvent.change(sectorFilter(), { target: { value: 'se' } })
    expect(codes()).toEqual(['EMP-002(ID)'])
    fireEvent.change(sectorFilter(), { target: { value: 'Todos' } })
    expect(codes()).toHaveLength(4)
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
    const renderWithBranches = async () => {
      render(
        <MemoryRouter>
          <ActiveBranchProvider>
            <SwitchTo id="f2" />
            <VisaoGeralPage />
          </ActiveBranchProvider>
        </MemoryRouter>
      )
      await screen.findAllByRole('article')
    }

    beforeEach(() => {
      localStorage.setItem('user', JSON.stringify(user))
      listar.mockResolvedValue(linked)
    })

    it('names the branch in each option when every branch is on screen', async () => {
      await renderWithBranches()

      expect([...sectorFilter().querySelectorAll('option')].map((o) => o.textContent)).toEqual([
        'Todos os setores',
        'Doca Nova · Filial 01',
        'Expedição - Bloco B · Filial 01',
      ])
    })

    it('requests the sectors of the active branch and goes back to "Todos os setores" when it changes', async () => {
      await renderWithBranches()
      fireEvent.change(sectorFilter(), { target: { value: 'sd' } })
      expect(codes()).toHaveLength(2)

      fireEvent.click(screen.getByText('switch to f2'))
      await screen.findAllByRole('article')

      expect(listarSetores).toHaveBeenLastCalledWith('f2')
      expect(sectorFilter()).toHaveValue('Todos')
      expect(codes()).toHaveLength(4)
      expect([...sectorFilter().querySelectorAll('option')].map((o) => o.textContent)).toEqual([
        'Todos os setores',
        'Doca Nova',
        'Expedição - Bloco B',
      ])
    })
  })
})

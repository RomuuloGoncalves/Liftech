import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../../components/common/Toast'
import { ActiveBranchProvider, useActiveBranch } from '../../context/ActiveBranchContext'
import EquipePage from '../../pages/EquipePage'
import styles from '../../pages/EquipePage.module.css'
import { operatorService } from '../../services/operatorService'
import type { EmployeeFormValues } from '../../components/team/EmployeeFormModal'
import type { Employee, Sector } from '../../data/team'
import { sectorService } from '../../services/sectorService'
import { EMPLOYEES, employee } from '../fixtures/employees'

vi.mock('../../services/operatorService', () => ({
  operatorService: {
    listar: vi.fn(),
    criar: vi.fn(),
    atualizar: vi.fn(),
    remover: vi.fn(),
    criarLogin: vi.fn(),
    atualizarLogin: vi.fn(),
  },
}))

vi.mock('../../services/sectorService', () => ({
  sectorService: { listar: vi.fn(), criar: vi.fn(), atualizar: vi.fn(), remover: vi.fn() },
}))

const sector = (_id: string, nome: string, filialId: string, filial: string): Sector =>
  ({ _id, nome, filialId, filial: { nome: filial } })
const SECTORS: Sector[] = [
  sector('s1', 'Expedição - Bloco B', 'f1', 'Unidade Votorantin'),
  sector('s2', 'Recebimento - Bloco A', 'f1', 'Unidade Votorantin'),
  sector('s3', 'Armazenagem - Bloco C', 'f1', 'Unidade Votorantin'),
  sector('s4', 'Expedição B - Acesso 3', 'f1', 'Unidade Votorantin'),
  sector('s5', 'Doca de Carga', 'f2', 'Unidade Centro'),
  sector('s6', 'Câmara Fria', 'f2', 'Unidade Centro'),
  sector('s7', 'Separação', 'f3', 'Unidade Norte'),
  sector('s8', 'Manutenção', 'f3', 'Unidade Norte'),
]

const listarSetores = vi.mocked(sectorService.listar)
const criarSetor = vi.mocked(sectorService.criar)
const atualizarSetor = vi.mocked(sectorService.atualizar)
const removerSetor = vi.mocked(sectorService.remover)

const listar = vi.mocked(operatorService.listar)
const criar = vi.mocked(operatorService.criar)
const atualizar = vi.mocked(operatorService.atualizar)
const remover = vi.mocked(operatorService.remover)
const criarLogin = vi.mocked(operatorService.criarLogin)
const atualizarLogin = vi.mocked(operatorService.atualizarLogin)

const httpError = (status: number, error?: string) =>
  Object.assign(new Error(`HTTP ${status}`), { isAxiosError: true, response: { status, data: { error } } })
const find = (id: string) => EMPLOYEES.find((e) => e.id === id) as Employee
const operatorFields = ({ nome, telefone, cargo, horarioEntrada, horarioSaida }: EmployeeFormValues) =>
  ({ nome, telefone, cargo, horarioEntrada, horarioSaida })

// What the API answers by default: the operator as sent, a generated matricula, the login when created.
beforeEach(() => {
  localStorage.clear()
  listar.mockReset()
  listar.mockResolvedValue(EMPLOYEES)
  criar.mockReset()
  criar.mockImplementation(async (values) =>
    employee({ ...operatorFields(values), id: 'srv-1', matricula: 'EMP-095', usuario: null, acesso: 'Negado' })
  )
  criarLogin.mockReset()
  criarLogin.mockImplementation(async (id, usuario) =>
    ({ ...(id === 'srv-1' ? await criar.mock.results[0].value : find(id)), usuario, acesso: 'Permitido' })
  )
  atualizar.mockReset()
  atualizar.mockImplementation(async (id, values) => ({ ...find(id), ...operatorFields(values) }))
  remover.mockReset()
  remover.mockResolvedValue(undefined)
  atualizarLogin.mockReset()
  atualizarLogin.mockImplementation(async (id, { acessoNegado }) =>
    ({ ...find(id), acesso: acessoNegado ? 'Negado' : 'Permitido' })
  )
  listarSetores.mockReset()
  listarSetores.mockResolvedValue(SECTORS)
  criarSetor.mockReset()
  criarSetor.mockImplementation(async ({ nome, filialId = 'f1' }) => sector('srv-s', nome, filialId, 'Do servidor'))
  atualizarSetor.mockReset()
  atualizarSetor.mockImplementation(async (id, { nome }) => ({ ...SECTORS.find((s) => s._id === id)!, nome }))
  removerSetor.mockReset()
  removerSetor.mockResolvedValue(undefined)
})

// The page loads the employees first; the toast provider is there so error toasts can be read.
const renderLoaded = async () => {
  const view = render(
    <ToastProvider>
      <EquipePage />
    </ToastProvider>
  )
  await screen.findByRole('heading', { name: 'Funcionários' })
  return view
}

const toastTexts = () =>
  within(screen.getByRole('status'))
    .queryAllByRole('listitem')
    .map((li) => li.textContent)
const employeeCards = () => screen.getAllByRole('switch')
const searchEmployees = (text: string) =>
  fireEvent.change(screen.getByRole('searchbox', { name: /Funcionários/ }), { target: { value: text } })
const filterAccess = (value: string) =>
  fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por acesso' }), { target: { value } })

describe('EquipePage: employees section', () => {
  it('lists every employee as a card with name, matricula and access', async () => {
    await renderLoaded()

    expect(screen.getByRole('heading', { name: 'Funcionários' })).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
    expect(screen.getByText('Alexandre Mattos')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
  })

  it('filters by nome, matricula and cargo, ignoring case', async () => {
    await renderLoaded()

    searchEmployees('CARLOS')
    expect(employeeCards()).toHaveLength(1)
    searchEmployees('emp-089')
    expect(screen.getByText('Rafael Lima')).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(1)
    searchEmployees('conferente')
    expect(employeeCards()).toHaveLength(2)
  })

  it('filters by access', async () => {
    await renderLoaded()
    const allowed = EMPLOYEES.filter((e) => e.acesso === 'Permitido').length

    filterAccess('Permitido')
    expect(employeeCards()).toHaveLength(allowed)
    filterAccess('Negado')
    expect(employeeCards()).toHaveLength(EMPLOYEES.length - allowed)
    filterAccess('Todos')
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
  })

  it('applies search and access together', async () => {
    await renderLoaded()

    filterAccess('Negado')
    searchEmployees('operador')
    employeeCards().forEach((toggle) => expect(toggle).toHaveAttribute('aria-checked', 'false'))
    expect(screen.getByText('Rafael Lima')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Silva')).not.toBeInTheDocument()
  })

  it('shows the empty state when nothing matches', async () => {
    await renderLoaded()

    searchEmployees('zzzz')
    expect(screen.getByText('Nenhum funcionário encontrado')).toBeInTheDocument()
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
  })

  it('flips access with the switch at once and saves acessoNegado through the API', async () => {
    await renderLoaded()

    const toggle = screen.getByRole('switch', { name: 'Alterar acesso de Alexandre Mattos' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    expect(atualizarLogin).toHaveBeenLastCalledWith('1', { acessoNegado: true })
    await act(async () => {})
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    expect(atualizarLogin).toHaveBeenLastCalledWith('1', { acessoNegado: false })
  })

  it('swaps the card for the API answer after the access change', async () => {
    let resolve!: (e: Employee) => void
    atualizarLogin.mockReturnValue(new Promise<Employee>((r) => (resolve = r)))
    await renderLoaded()

    fireEvent.click(screen.getByRole('switch', { name: 'Alterar acesso de Alexandre Mattos' }))
    await act(async () => resolve({ ...find('1'), nome: 'Alexandre M.', acesso: 'Negado' }))

    expect(screen.getByRole('switch', { name: 'Alterar acesso de Alexandre M.' })).toHaveAttribute('aria-checked', 'false')
  })

  it('puts the access back and shows an error toast when the API refuses it', async () => {
    atualizarLogin.mockRejectedValue(httpError(500))
    await renderLoaded()

    const toggle = screen.getByRole('switch', { name: 'Alterar acesso de Alexandre Mattos' })
    fireEvent.click(toggle)

    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'))
    expect(toastTexts()).toContain('Não foi possível salvar o funcionário. Tente novamente.')
  })

  it('keeps the switch disabled for an employee without login', async () => {
    await renderLoaded()

    const toggle = screen.getByRole('switch', { name: 'Alterar acesso de Diego Martins' })
    expect(toggle).toBeDisabled()
    fireEvent.click(toggle)
    expect(atualizarLogin).not.toHaveBeenCalled()
  })

  it('drops a card from the view when the access filter no longer matches', async () => {
    await renderLoaded()

    filterAccess('Permitido')
    fireEvent.click(screen.getByRole('switch', { name: 'Alterar acesso de Alexandre Mattos' }))
    expect(screen.queryByText('Alexandre Mattos')).not.toBeInTheDocument()
  })
})

function fillEmployeeForm(values: Record<string, string>) {
  for (const [label, value] of Object.entries(values)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
}

describe('EquipePage: create, edit and details', () => {
  it('creates the operator, then its login, and puts the answer at the top with access Permitido', async () => {
    await renderLoaded()
    const before = employeeCards().length

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Funcionário' }))
    fillEmployeeForm({ 'Nome funcionário': 'Maria Lima', Cargo: 'Operadora', Usuário: 'maria', Senha: 'Maria123' })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('EMP-095(ID)')).toBeInTheDocument()
    expect(criar).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Maria Lima', cargo: 'Operadora' }), undefined)
    expect(criarLogin).toHaveBeenCalledWith('srv-1', 'maria', 'Maria123')
    expect(criar.mock.invocationCallOrder[0]).toBeLessThan(criarLogin.mock.invocationCallOrder[0])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(employeeCards()).toHaveLength(before + 1)
    const created = screen.getByRole('switch', { name: 'Alterar acesso de Maria Lima' })
    expect(created).toHaveAttribute('aria-checked', 'true')
    expect(employeeCards()[0]).toBe(created)
  })

  it('keeps the dialog open and does not add anyone when the form is invalid', async () => {
    await renderLoaded()
    const before = employeeCards().length

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Funcionário' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(before)
  })

  it('edits an employee in place and keeps the active search', async () => {
    await renderLoaded()

    searchEmployees('alexandre')
    fireEvent.click(screen.getByRole('button', { name: 'Editar Alexandre Mattos' }))
    expect(screen.getByRole('dialog', { name: 'Editar informações do funcionário' })).toBeInTheDocument()
    fillEmployeeForm({ Cargo: 'Supervisor' })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(employeeCards()).toHaveLength(1)
    expect(screen.getByText('Alexandre Mattos')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: /Funcionários/ })).toHaveValue('alexandre')
    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Alexandre Mattos' }))
    expect(screen.getByLabelText('Cargo')).toHaveValue('Supervisor')
  })

  it('does not change the list when the edit is cancelled', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Alexandre Mattos' }))
    fillEmployeeForm({ Cargo: 'Outro' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Alexandre Mattos' }))
    expect(screen.getByLabelText('Cargo')).toHaveValue('Ajudante')
  })

  it('opens the read-only details when the card body is clicked', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Alexandre Mattos' }))
    expect(screen.getByRole('dialog', { name: 'Informações do funcionário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('readonly')
  })
})

const sectorCards = () =>
  SECTORS.flatMap((s) => screen.queryAllByRole('button', { name: `Ver detalhes de ${s.nome}` }))
const searchSectors = (text: string) =>
  fireEvent.change(screen.getByRole('searchbox', { name: /Setores/ }), { target: { value: text } })

describe('EquipePage: sectors section', () => {
  it('lists every sector as a card', async () => {
    await renderLoaded()

    expect(screen.getByRole('heading', { name: 'Setores' })).toBeInTheDocument()
    expect(sectorCards()).toHaveLength(SECTORS.length)
  })

  it('filters sectors by nome and branch name, ignoring case', async () => {
    await renderLoaded()

    searchSectors('DOCA')
    expect(sectorCards()).toHaveLength(1)
    searchSectors('unidade norte')
    expect(sectorCards()).toHaveLength(2)
  })

  it('shows the empty state when no sector matches', async () => {
    await renderLoaded()

    searchSectors('zzzz')
    expect(screen.getByText('Nenhum setor encontrado')).toBeInTheDocument()
  })

  it('creates a sector at the top of the list', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    expect(screen.getByRole('dialog', { name: 'Cadastrar um novo setor' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Setor-novo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver detalhes de Setor-novo' })).toBeInTheDocument()
  })

  it('keeps the dialog open when the sector form is invalid', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('edits a sector over the existing one with the pencil', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    expect(screen.getByRole('dialog', { name: 'Editar setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome setor')).toHaveValue('Doca de Carga')
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Doca Sul' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.queryByRole('button', { name: 'Ver detalhes de Doca de Carga' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver detalhes de Doca Sul' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Editar / }).length).toBeGreaterThanOrEqual(SECTORS.length)
  })

  it('opens the read-only sector details when the card body is clicked', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Doca de Carga' }))
    expect(screen.getByRole('dialog', { name: 'Informações do setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Filial')).toHaveValue('Unidade Centro')
    expect(screen.getByLabelText('Filial')).toHaveAttribute('readonly')
  })

  it('shows one dialog at a time', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })
})

describe('EquipePage: delete with confirmation', () => {
  it('asks for confirmation naming the employee, then removes them', async () => {
    await renderLoaded()
    const before = employeeCards().length

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Alexandre Mattos' }))
    expect(screen.getByRole('dialog', { name: 'Excluir funcionário' })).toBeInTheDocument()
    expect(screen.getByText('Excluir Alexandre Mattos? Esta ação não pode ser desfeita.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Alexandre Mattos')).not.toBeInTheDocument()
    expect(employeeCards()).toHaveLength(before - 1)
  })

  it('asks for confirmation naming the sector, then removes it', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Doca de Carga' }))
    expect(screen.getByRole('dialog', { name: 'Excluir setor' })).toBeInTheDocument()
    expect(screen.getByText('Excluir Doca de Carga? Esta ação não pode ser desfeita.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(screen.queryByRole('button', { name: 'Ver detalhes de Doca de Carga' })).not.toBeInTheDocument()
    expect(sectorCards()).toHaveLength(SECTORS.length - 1)
  })

  it.each([
    ['Cancelar', () => fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))],
    ['Escape', () => fireEvent.keyDown(window, { key: 'Escape' })],
    ['backdrop', () => fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)],
  ])('keeps the item when the confirmation is dismissed with %s', async (_name, dismiss) => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Alexandre Mattos' }))
    dismiss()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Alexandre Mattos')).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
  })
})

describe('EquipePage skeleton', () => {
  beforeEach(() => {
    listar.mockReturnValue(new Promise<Employee[]>(() => {}))
  })

  it('shows the team skeleton without toolbars while the employees load', () => {
    const { container } = render(<EquipePage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(container.querySelectorAll('[data-skeleton-card]')).toHaveLength(16)
    expect(screen.queryByRole('button', { name: 'Cadastrar Funcionário' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cadastrar Setor' })).not.toBeInTheDocument()
  })

  it('mirrors the two sections with the page classes: title, toolbar and an 8-card grid each', () => {
    const { container } = render(<EquipePage />)
    const sections = [...container.querySelectorAll(`.${styles.section}`)]
    expect(sections).toHaveLength(2)
    const headers = sections.map((section) => section.querySelector(`.${styles.sectionHeader}`)!)
    expect(headers.map((header) => header.querySelector(`.${styles.toolbar}`)!.children.length)).toEqual([3, 2])
    const grids = sections.map((section) => section.querySelector(`.${styles.grid}`)!)
    expect(grids.map((grid) => grid.querySelectorAll('[data-skeleton-card]').length)).toEqual([8, 8])
    expect(grids[0].querySelectorAll('[data-skeleton-part="switch"]')).toHaveLength(8)
    expect(grids[1].querySelectorAll('[data-skeleton-part="buttons"]')).toHaveLength(8)
  })
})

describe('EquipePage notifications', () => {
  const renderWithToasts = renderLoaded

  it('announces a registered employee once the API saved it', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Funcionário' }))
    fillEmployeeForm({ 'Nome funcionário': 'Maria Lima', Cargo: 'Operadora', Usuário: 'maria', Senha: 'Maria123' })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(toastTexts()).toEqual(['Funcionário "Maria Lima" cadastrado']))
  })

  it('announces a saved employee', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Alexandre Mattos' }))
    fillEmployeeForm({ Cargo: 'Supervisor' })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(toastTexts()).toEqual(['Funcionário "Alexandre Mattos" salvo'])
  })

  it('announces a deleted employee', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Alexandre Mattos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(toastTexts()).toEqual(['Funcionário "Alexandre Mattos" excluído'])
  })

  it('announces a registered sector', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Setor-novo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))
    expect(toastTexts()).toEqual(['Setor "Setor-novo" cadastrado'])
  })

  it('announces a saved sector', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Doca Sul' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(toastTexts()).toEqual(['Setor "Doca Sul" salvo'])
  })

  it('announces a deleted sector', async () => {
    await renderWithToasts()
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Doca de Carga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(toastTexts()).toEqual(['Setor "Doca de Carga" excluído'])
  })
})

describe('EquipePage: loading from the API', () => {
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
          <EquipePage />
        </ActiveBranchProvider>
      </MemoryRouter>
    )

  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify(user))
  })

  it('lists the employees the API returns for the active branch', async () => {
    localStorage.setItem('liftech.activeBranch', 'f2')
    listar.mockResolvedValue([find('1'), find('2')])

    renderWithBranches()

    expect(await screen.findByText('Alexandre Mattos')).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(2)
    expect(listar).toHaveBeenCalledWith('f2')
  })

  it('requests without a branch when the active branch is todas', async () => {
    renderWithBranches()

    await screen.findByText('Alexandre Mattos')
    expect(listar).toHaveBeenCalledWith(undefined)
  })

  it('goes back to the skeleton and requests again when the active branch changes', async () => {
    listar.mockResolvedValueOnce(EMPLOYEES)
    listar.mockReturnValueOnce(new Promise<Employee[]>(() => {}))
    const { container } = renderWithBranches()
    await screen.findByText('Alexandre Mattos')

    fireEvent.click(screen.getByText('switch to f2'))

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(listar).toHaveBeenLastCalledWith('f2')
  })

  it('shows the load error with a retry that goes back to the skeleton and then to the cards', async () => {
    listar.mockRejectedValueOnce(new Error('Network Error'))
    let resolve!: (list: Employee[]) => void
    listar.mockReturnValueOnce(new Promise<Employee[]>((r) => (resolve = r)))
    const { container } = render(<EquipePage />)

    expect(await screen.findByText('Não foi possível carregar os funcionários.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Setores' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(listar).toHaveBeenCalledTimes(2)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    await act(async () => resolve([find('1')]))
    expect(employeeCards()).toHaveLength(1)
  })
})

describe('EquipePage: create through the API', () => {
  const register = (values: Record<string, string> = {}) => {
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Funcionário' }))
    fillEmployeeForm({ 'Nome funcionário': 'Maria Lima', Cargo: 'Operadora', Usuário: 'maria', Senha: 'Maria123', ...values })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  }

  it('waits for the API: nothing enters before the operator is saved', async () => {
    criar.mockReturnValue(new Promise<Employee>(() => {}))
    await renderLoaded()

    register()

    expect(screen.queryByText('Maria Lima')).not.toBeInTheDocument()
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
  })

  it('adds nobody and shows an error toast when the operator is refused', async () => {
    criar.mockRejectedValue(httpError(500))
    await renderLoaded()

    register()

    await waitFor(() => expect(toastTexts()).toContain('Não foi possível salvar o funcionário. Tente novamente.'))
    expect(criarLogin).not.toHaveBeenCalled()
    expect(screen.queryByRole('switch', { name: 'Alterar acesso de Maria Lima' })).not.toBeInTheDocument()
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
  })

  it('keeps the employee without login and warns when the login is refused', async () => {
    criarLogin.mockRejectedValue(httpError(500))
    await renderLoaded()

    register()

    const created = await screen.findByRole('switch', { name: 'Alterar acesso de Maria Lima' })
    expect(created).toBeDisabled()
    expect(created).toHaveAttribute('aria-checked', 'false')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(toastTexts()).toContain('Funcionário cadastrado, mas não foi possível criar o login. Edite-o para tentar de novo.')
  })

  it('keeps the form open on a taken usuario and only creates the login on the next Confirmar', async () => {
    criarLogin.mockRejectedValueOnce(httpError(409))
    await renderLoaded()

    register()

    await waitFor(() => expect(toastTexts()).toContain('Este usuário já está em uso'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Alterar acesso de Maria Lima' })).toBeDisabled()

    fillEmployeeForm({ Usuário: 'maria.lima', Senha: 'Maria123' })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(criarLogin).toHaveBeenLastCalledWith('srv-1', 'maria.lima', 'Maria123'))
    expect(criar).toHaveBeenCalledTimes(1)
    expect(atualizar).toHaveBeenCalledWith('srv-1', expect.objectContaining({ nome: 'Maria Lima' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('EquipePage: branch on register', () => {
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
  const openRegister = async () => {
    render(
      <MemoryRouter>
        <ActiveBranchProvider>
          <EquipePage />
        </ActiveBranchProvider>
      </MemoryRouter>
    )
    await screen.findByText('Alexandre Mattos')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Funcionário' }))
    fillEmployeeForm({ 'Nome funcionário': 'Maria Lima', Cargo: 'Operadora', Usuário: 'maria', Senha: 'Maria123' })
  }

  beforeEach(() => {
    localStorage.setItem('user', JSON.stringify(user))
  })

  it('with "todas" and two branches the form asks for the branch and sends the chosen one', async () => {
    await openRegister()

    expect(screen.getByLabelText('Filial')).toHaveValue('f1')
    fireEvent.change(screen.getByLabelText('Filial'), { target: { value: 'f2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(criar).toHaveBeenCalledWith(expect.objectContaining({ filialId: 'f2' }), 'f2'))
  })

  it('with an active branch the form has no Filial field and registers in the active branch', async () => {
    localStorage.setItem('liftech.activeBranch', 'f2')
    await openRegister()

    expect(screen.queryByLabelText('Filial')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(criar).toHaveBeenCalledWith(expect.not.objectContaining({ filialId: expect.anything() }), 'f2'))
  })
})

describe('EquipePage: edit through the API', () => {
  const edit = (name: string, values: Record<string, string>) => {
    fireEvent.click(screen.getByRole('button', { name: `Editar ${name}` }))
    fillEmployeeForm(values)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
  }

  it('saves the operator fields and keeps the password when it is left blank', async () => {
    await renderLoaded()

    edit('Alexandre Mattos', { Cargo: 'Supervisor' })

    await waitFor(() =>
      expect(atualizar).toHaveBeenCalledWith('1', expect.objectContaining({ cargo: 'Supervisor', senha: '' }))
    )
    expect(atualizarLogin).not.toHaveBeenCalled()
    expect(criarLogin).not.toHaveBeenCalled()
  })

  it('changes the password when one is typed', async () => {
    await renderLoaded()

    edit('Alexandre Mattos', { Senha: 'NovaSenha1' })

    await waitFor(() => expect(atualizarLogin).toHaveBeenCalledWith('1', { senha: 'NovaSenha1' }))
    expect(criarLogin).not.toHaveBeenCalled()
  })

  it('creates the login of an employee without one when usuario and senha are filled', async () => {
    await renderLoaded()

    edit('Diego Martins', { Usuário: 'diego', Senha: 'Diego12345' })

    expect(screen.getByRole('switch', { name: 'Alterar acesso de Diego Martins' })).toBeEnabled()
    await waitFor(() => expect(criarLogin).toHaveBeenCalledWith('11', 'diego', 'Diego12345'))
    expect(atualizar).toHaveBeenCalledWith('11', expect.objectContaining({ nome: 'Diego Martins' }))
    expect(screen.getByRole('switch', { name: 'Alterar acesso de Diego Martins' })).toHaveAttribute('aria-checked', 'true')
  })

  it('puts the previous values back and shows an error toast when the edit fails', async () => {
    atualizar.mockRejectedValue(httpError(500))
    await renderLoaded()

    edit('Alexandre Mattos', { 'Nome funcionário': 'Alexandre Novo' })
    expect(screen.getByText('Alexandre Novo')).toBeInTheDocument()

    expect(await screen.findByText('Alexandre Mattos')).toBeInTheDocument()
    expect(screen.queryByText('Alexandre Novo')).not.toBeInTheDocument()
    expect(toastTexts()).toContain('Não foi possível salvar o funcionário. Tente novamente.')
  })

  it('takes back the new login and says the usuario is taken when the API answers 409', async () => {
    criarLogin.mockRejectedValue(httpError(409))
    await renderLoaded()

    edit('Diego Martins', { Usuário: 'diego', Senha: 'Diego12345' })

    await waitFor(() => expect(toastTexts()).toContain('Este usuário já está em uso'))
    expect(screen.getByRole('switch', { name: 'Alterar acesso de Diego Martins' })).toBeDisabled()
  })
})

describe('EquipePage: delete through the API', () => {
  const remove = (name: string) => {
    fireEvent.click(screen.getByRole('button', { name: `Excluir ${name}` }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
  }

  it('deletes the operator through the API', async () => {
    await renderLoaded()

    remove('Alexandre Mattos')

    expect(remover).toHaveBeenCalledWith('1')
    await act(async () => {})
    expect(screen.queryByText('Alexandre Mattos')).not.toBeInTheDocument()
  })

  it('brings the employee back in place with the open-session toast when the API answers 409', async () => {
    remover.mockRejectedValue(httpError(409))
    await renderLoaded()

    remove('Carlos Silva')
    expect(screen.queryByText('Carlos Silva')).not.toBeInTheDocument()

    expect(await screen.findByText('Carlos Silva')).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
    expect(employeeCards()[1]).toHaveAccessibleName('Alterar acesso de Carlos Silva')
    expect(toastTexts()).toContain('Funcionário com sessão aberta: encerre a sessão antes de excluir.')
  })

  it('brings the employee back with the generic error toast when the delete fails otherwise', async () => {
    remover.mockRejectedValue(new Error('Network Error'))
    await renderLoaded()

    remove('Carlos Silva')

    expect(await screen.findByText('Carlos Silva')).toBeInTheDocument()
    expect(toastTexts()).toContain('Não foi possível salvar o funcionário. Tente novamente.')
  })
})

describe('EquipePage: sectors through the API', () => {
  const companyUser = {
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
  const renderWithUser = async (user: object, activeBranch?: string) => {
    localStorage.setItem('user', JSON.stringify(user))
    if (activeBranch) localStorage.setItem('liftech.activeBranch', activeBranch)
    render(
      <MemoryRouter>
        <ToastProvider>
          <ActiveBranchProvider>
            <EquipePage />
          </ActiveBranchProvider>
        </ToastProvider>
      </MemoryRouter>
    )
    await screen.findByRole('heading', { name: 'Setores' })
  }
  const openCard = (name: string) => screen.queryByRole('button', { name: `Ver detalhes de ${name}` })

  it('requests the sectors of the active branch, and all of them with todas', async () => {
    await renderWithUser(companyUser, 'f2')
    expect(listarSetores).toHaveBeenCalledWith('f2')
  })

  it('requests the sectors without a branch when the active branch is todas', async () => {
    await renderWithUser(companyUser)
    expect(listarSetores).toHaveBeenCalledWith(undefined)
  })

  it('lists the sectors the API returns with their branch name', async () => {
    listarSetores.mockResolvedValue([sector('x1', 'Pátio', 'f1', 'Filial 01')])
    await renderLoaded()

    expect(sectorCards()).toHaveLength(0)
    expect(openCard('Pátio')).toBeInTheDocument()
    expect(screen.getByText('Filial 01')).toBeInTheDocument()
  })

  it('keeps the skeleton until the sectors arrive', async () => {
    let resolve!: (list: Sector[]) => void
    listarSetores.mockReturnValue(new Promise<Sector[]>((r) => (resolve = r)))
    const { container } = render(<EquipePage />)

    await act(async () => {})
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    await act(async () => resolve(SECTORS))
    expect(sectorCards()).toHaveLength(SECTORS.length)
  })

  it('shows the error with a retry when the sectors fail to load', async () => {
    listarSetores.mockRejectedValueOnce(new Error('Network Error'))
    render(<EquipePage />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('heading', { name: 'Setores' })).toBeInTheDocument()
    expect(listarSetores).toHaveBeenCalledTimes(2)
    expect(sectorCards()).toHaveLength(SECTORS.length)
  })

  it('creates at once and swaps in the API answer', async () => {
    let resolve!: (s: Sector) => void
    criarSetor.mockReturnValue(new Promise<Sector>((r) => (resolve = r)))
    await renderWithUser(companyUser, 'f2')

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    expect(screen.getByLabelText('Filial')).toHaveValue('f2')
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Pátio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    expect(criarSetor).toHaveBeenCalledWith({ nome: 'Pátio', filialId: 'f2' })
    expect(openCard('Pátio')).toBeInTheDocument()
    expect(screen.getByText('Filial 02')).toBeInTheDocument()

    await act(async () => resolve(sector('srv-s', 'Pátio', 'f2', 'Do servidor')))
    expect(screen.getByText('Do servidor')).toBeInTheDocument()
    expect(screen.queryByText('Filial 02')).not.toBeInTheDocument()
  })

  it('takes the new sector out and says the name is taken on a 409', async () => {
    criarSetor.mockRejectedValue(httpError(409, 'Já existe um setor com este nome nesta filial.'))
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Pátio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    await waitFor(() => expect(toastTexts()).toContain('Já existe um setor com este nome nesta filial'))
    expect(openCard('Pátio')).not.toBeInTheDocument()
    expect(sectorCards()).toHaveLength(SECTORS.length)
  })

  it('takes the new sector out with the generic error when the create fails otherwise', async () => {
    criarSetor.mockRejectedValue(new Error('Network Error'))
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Pátio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    await waitFor(() => expect(toastTexts()).toContain('Não foi possível salvar o funcionário. Tente novamente.'))
    expect(openCard('Pátio')).not.toBeInTheDocument()
  })

  it('branch scope: an edit sends only the name', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Doca Sul' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(atualizarSetor).toHaveBeenCalledWith('s5', { nome: 'Doca Sul' })
    await act(async () => {})
    expect(openCard('Doca Sul')).toBeInTheDocument()
  })

  it('company scope: an edit can move the sector to another branch', async () => {
    await renderWithUser(companyUser)

    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    fireEvent.change(screen.getByLabelText('Filial'), { target: { value: 'f1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(atualizarSetor).toHaveBeenCalledWith('s5', { nome: 'Doca de Carga', filialId: 'f1' })
  })

  it('puts the sector back with the machine count when a move is refused with 409', async () => {
    atualizarSetor.mockRejectedValue(httpError(409, 'Setor com 2 máquina(s) ligada(s) não pode mudar de filial.'))
    await renderWithUser(companyUser)

    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Doca Sul' } })
    fireEvent.change(screen.getByLabelText('Filial'), { target: { value: 'f1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(openCard('Doca Sul')).toBeInTheDocument()

    await waitFor(() =>
      expect(toastTexts()).toContain('Setor com 2 máquina(s) ligada(s) não pode mudar de filial')
    )
    expect(openCard('Doca Sul')).not.toBeInTheDocument()
    expect(openCard('Doca de Carga')).toBeInTheDocument()
  })

  it('puts the sector back with the name-taken toast on a 409 without count', async () => {
    atualizarSetor.mockRejectedValue(httpError(409, 'Já existe um setor com este nome nesta filial.'))
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Câmara Fria' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() => expect(toastTexts()).toContain('Já existe um setor com este nome nesta filial'))
    expect(openCard('Doca de Carga')).toBeInTheDocument()
  })

  it('deletes through the API', async () => {
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Doca de Carga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    expect(removerSetor).toHaveBeenCalledWith('s5')
    await act(async () => {})
    expect(openCard('Doca de Carga')).not.toBeInTheDocument()
  })

  it('brings the sector back in place with the machine count when the delete answers 409', async () => {
    removerSetor.mockRejectedValue(httpError(409, 'Setor com 3 máquina(s) ligada(s).'))
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Doca de Carga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(openCard('Doca de Carga')).not.toBeInTheDocument()

    await waitFor(() => expect(toastTexts()).toContain('Setor com 3 máquina(s) ligada(s)'))
    expect(sectorCards()).toHaveLength(SECTORS.length)
    expect(sectorCards()[4]).toHaveAccessibleName('Ver detalhes de Doca de Carga')
  })

  it('brings the sector back with the generic error when the delete fails otherwise', async () => {
    removerSetor.mockRejectedValue(new Error('Network Error'))
    await renderLoaded()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Doca de Carga' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(toastTexts()).toContain('Não foi possível salvar o funcionário. Tente novamente.'))
    expect(openCard('Doca de Carga')).toBeInTheDocument()
  })
})

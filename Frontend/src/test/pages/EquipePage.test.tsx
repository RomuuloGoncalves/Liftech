import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EquipePage from '../../pages/EquipePage'
import { EMPLOYEES, SECTORS } from '../../data/team'

const employeeCards = () => screen.getAllByRole('switch')
const searchEmployees = (text: string) =>
  fireEvent.change(screen.getByRole('searchbox', { name: /Funcionários/ }), { target: { value: text } })
const filterAccess = (value: string) =>
  fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por acesso' }), { target: { value } })

describe('EquipePage: employees section', () => {
  it('lists every employee as a card with name, matricula and access', () => {
    render(<EquipePage />)

    expect(screen.getByRole('heading', { name: 'Funcionários' })).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
    expect(screen.getByText('Alexandre Mattos')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
  })

  it('filters by nome, matricula and cargo, ignoring case', () => {
    render(<EquipePage />)

    searchEmployees('CARLOS')
    expect(employeeCards()).toHaveLength(1)
    searchEmployees('emp-089')
    expect(screen.getByText('Rafael Lima')).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(1)
    searchEmployees('conferente')
    expect(employeeCards()).toHaveLength(2)
  })

  it('filters by access', () => {
    render(<EquipePage />)
    const allowed = EMPLOYEES.filter((e) => e.acesso === 'Permitido').length

    filterAccess('Permitido')
    expect(employeeCards()).toHaveLength(allowed)
    filterAccess('Negado')
    expect(employeeCards()).toHaveLength(EMPLOYEES.length - allowed)
    filterAccess('Todos')
    expect(employeeCards()).toHaveLength(EMPLOYEES.length)
  })

  it('applies search and access together', () => {
    render(<EquipePage />)

    filterAccess('Negado')
    searchEmployees('operador')
    employeeCards().forEach((toggle) => expect(toggle).toHaveAttribute('aria-checked', 'false'))
    expect(screen.getByText('Rafael Lima')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Silva')).not.toBeInTheDocument()
  })

  it('shows the empty state when nothing matches', () => {
    render(<EquipePage />)

    searchEmployees('zzzz')
    expect(screen.getByText('Nenhum funcionário encontrado')).toBeInTheDocument()
    expect(screen.queryAllByRole('switch')).toHaveLength(0)
  })

  it('flips access with the switch and updates the card label', () => {
    render(<EquipePage />)

    const toggle = screen.getByRole('switch', { name: 'Alterar acesso de Alexandre Mattos' })
    expect(toggle).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  it('drops a card from the view when the access filter no longer matches', () => {
    render(<EquipePage />)

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
  it('creates an employee at the top with the next matricula and access Permitido', () => {
    render(<EquipePage />)
    const before = employeeCards().length

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Funcionário' }))
    fillEmployeeForm({ 'Nome funcionário': 'Maria Lima', Cargo: 'Operadora', Usuário: 'maria', Senha: 'Maria123' })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(employeeCards()).toHaveLength(before + 1)
    expect(screen.getByText('EMP-095(ID)')).toBeInTheDocument()
    const created = screen.getByRole('switch', { name: 'Alterar acesso de Maria Lima' })
    expect(created).toHaveAttribute('aria-checked', 'true')
    expect(employeeCards()[0]).toBe(created)
  })

  it('keeps the dialog open and does not add anyone when the form is invalid', () => {
    render(<EquipePage />)
    const before = employeeCards().length

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Funcionário' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(employeeCards()).toHaveLength(before)
  })

  it('edits an employee in place and keeps the active search', () => {
    render(<EquipePage />)

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

  it('does not change the list when the edit is cancelled', () => {
    render(<EquipePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Editar Alexandre Mattos' }))
    fillEmployeeForm({ Cargo: 'Outro' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Alexandre Mattos' }))
    expect(screen.getByLabelText('Cargo')).toHaveValue('Ajudante')
  })

  it('opens the read-only details when the card body is clicked', () => {
    render(<EquipePage />)

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
  it('lists every sector as a card', () => {
    render(<EquipePage />)

    expect(screen.getByRole('heading', { name: 'Setores' })).toBeInTheDocument()
    expect(sectorCards()).toHaveLength(SECTORS.length)
  })

  it('filters sectors by nome and unidade, ignoring case', () => {
    render(<EquipePage />)

    searchSectors('DOCA')
    expect(sectorCards()).toHaveLength(1)
    searchSectors('unidade norte')
    expect(sectorCards()).toHaveLength(2)
  })

  it('shows the empty state when no sector matches', () => {
    render(<EquipePage />)

    searchSectors('zzzz')
    expect(screen.getByText('Nenhum setor encontrado')).toBeInTheDocument()
  })

  it('creates a sector at the top of the list', () => {
    render(<EquipePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    expect(screen.getByRole('dialog', { name: 'Cadastrar um novo setor' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Setor-novo' } })
    fireEvent.change(screen.getByLabelText('Unidade'), { target: { value: 'Unidade Sul' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver detalhes de Setor-novo' })).toBeInTheDocument()
  })

  it('keeps the dialog open when the sector form is invalid', () => {
    render(<EquipePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('edits a sector over the existing one with the pencil', () => {
    render(<EquipePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    expect(screen.getByRole('dialog', { name: 'Editar setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome setor')).toHaveValue('Doca de Carga')
    fireEvent.change(screen.getByLabelText('Nome setor'), { target: { value: 'Doca Sul' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(screen.queryByRole('button', { name: 'Ver detalhes de Doca de Carga' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver detalhes de Doca Sul' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Editar / }).length).toBeGreaterThanOrEqual(SECTORS.length)
  })

  it('opens the read-only sector details when the card body is clicked', () => {
    render(<EquipePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Doca de Carga' }))
    expect(screen.getByRole('dialog', { name: 'Informações do setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Unidade')).toHaveValue('Unidade Centro')
    expect(screen.getByLabelText('Unidade')).toHaveAttribute('readonly')
  })

  it('shows one dialog at a time', () => {
    render(<EquipePage />)

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Setor' }))
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })
})

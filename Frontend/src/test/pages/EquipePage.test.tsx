import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EquipePage from '../../pages/EquipePage'
import { EMPLOYEES } from '../../data/team'

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

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

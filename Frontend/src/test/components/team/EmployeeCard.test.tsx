import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmployeeCard from '../../../components/team/EmployeeCard'
import type { Employee } from '../../../data/team'

const employee: Employee = {
  id: '1',
  matricula: 'EMP-084',
  nome: 'Alexandre Mattos',
  telefone: '',
  cargo: 'Ajudante',
  horarioEntrada: '',
  horarioSaida: '',
  usuario: 'alexandre',
  senha: 'x',
  acesso: 'Permitido',
}

function setup(overrides: Partial<Employee> = {}) {
  const handlers = { onOpen: vi.fn(), onToggleAccess: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
  const e = { ...employee, ...overrides }
  render(<EmployeeCard employee={e} {...handlers} />)
  return { handlers, employee: e }
}

describe('EmployeeCard', () => {
  it('shows nome, matricula and the access label', () => {
    setup()

    expect(screen.getByText('Alexandre Mattos')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(screen.getByText('Permitido')).toBeInTheDocument()
  })

  it('shows "Negado" and an off switch when access is denied', () => {
    setup({ acesso: 'Negado' })

    expect(screen.getByText('Negado')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Alterar acesso de Alexandre Mattos' })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('exposes the allowed state as an on switch', () => {
    setup()

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('calls onToggleAccess with the employee when the switch is clicked', () => {
    const { handlers, employee: e } = setup()

    fireEvent.click(screen.getByRole('switch'))
    expect(handlers.onToggleAccess).toHaveBeenCalledWith(e)
    expect(handlers.onOpen).not.toHaveBeenCalled()
  })

  it('calls onEdit from the pencil and onDelete from the trash, labelled with the name', () => {
    const { handlers, employee: e } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Alexandre Mattos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Alexandre Mattos' }))
    expect(handlers.onEdit).toHaveBeenCalledWith(e)
    expect(handlers.onDelete).toHaveBeenCalledWith(e)
    expect(handlers.onOpen).not.toHaveBeenCalled()
  })

  it('calls onOpen when the card body is clicked', () => {
    const { handlers, employee: e } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Alexandre Mattos' }))
    expect(handlers.onOpen).toHaveBeenCalledWith(e)
    expect(handlers.onToggleAccess).not.toHaveBeenCalled()
  })
})

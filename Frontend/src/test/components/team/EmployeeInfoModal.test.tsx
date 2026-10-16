import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmployeeInfoModal from '../../../components/team/EmployeeInfoModal'
import { employee as make } from '../../fixtures/employees'

const employee = make({
  id: '1',
  matricula: 'EMP-084',
  nome: 'Alexandre Mattos',
  telefone: '(55) 15 999999999',
  cargo: 'Ajudante',
  horarioEntrada: '08:00',
  horarioSaida: '17:00',
  usuario: 'AlexandreMattos',
})

describe('EmployeeInfoModal', () => {
  it('shows every field read-only', () => {
    render(<EmployeeInfoModal employee={employee} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Informações do funcionário' })).toBeInTheDocument()
    const expected: Record<string, string> = {
      'Nome funcionário': 'Alexandre Mattos',
      Telefone: '(55) 15 999999999',
      Cargo: 'Ajudante',
      'Horário Entrada': '08:00',
      'Horário saída': '17:00',
      Usuário: 'AlexandreMattos',
    }
    for (const [label, value] of Object.entries(expected)) {
      expect(screen.getByLabelText(label)).toHaveValue(value)
      expect(screen.getByLabelText(label)).toHaveAttribute('readonly')
    }
  })

  it('has no password row: the API never returns the password', () => {
    render(<EmployeeInfoModal employee={employee} onClose={vi.fn()} />)

    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mostrar senha' })).not.toBeInTheDocument()
  })

  it('shows an empty Usuário for an employee without a login', () => {
    render(<EmployeeInfoModal employee={{ ...employee, usuario: null }} onClose={vi.fn()} />)

    expect(screen.getByLabelText('Usuário')).toHaveValue('')
  })

  it('has no Cancelar or Confirmar buttons', () => {
    render(<EmployeeInfoModal employee={employee} onClose={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar' })).not.toBeInTheDocument()
  })

  it('calls onClose from the close icon', () => {
    const onClose = vi.fn()
    render(<EmployeeInfoModal employee={employee} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

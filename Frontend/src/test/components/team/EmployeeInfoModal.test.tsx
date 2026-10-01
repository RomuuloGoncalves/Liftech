import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmployeeInfoModal from '../../../components/team/EmployeeInfoModal'
import type { Employee } from '../../../data/team'

const employee: Employee = {
  id: '1',
  matricula: 'EMP-084',
  nome: 'Alexandre Mattos',
  telefone: '(55) 15 999999999',
  cargo: 'Ajudante',
  horarioEntrada: '08:00',
  horarioSaida: '17:00',
  usuario: 'AlexandreMattos',
  senha: 'Alexandre123',
  acesso: 'Permitido',
}

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
      Senha: 'Alexandre123',
    }
    for (const [label, value] of Object.entries(expected)) {
      expect(screen.getByLabelText(label)).toHaveValue(value)
      expect(screen.getByLabelText(label)).toHaveAttribute('readonly')
    }
  })

  it('hides the password by default and toggles it with the eye icon', () => {
    render(<EmployeeInfoModal employee={employee} onClose={vi.fn()} />)

    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
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

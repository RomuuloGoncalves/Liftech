import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmployeeFormModal from '../../../components/team/EmployeeFormModal'
import type { Employee } from '../../../data/team'

const alexandre: Employee = {
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
const ana: Employee = { ...alexandre, id: '2', matricula: 'EMP-085', nome: 'Ana', usuario: 'ana' }

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

function fillRequired() {
  fill('Nome funcionário', 'Maria Lima')
  fill('Cargo', 'Operadora')
  fill('Usuário', 'maria')
  fill('Senha', 'Maria123')
}

function renderForm(props: Partial<React.ComponentProps<typeof EmployeeFormModal>> = {}) {
  const onSave = vi.fn()
  const onClose = vi.fn()
  render(<EmployeeFormModal existing={[alexandre, ana]} onSave={onSave} onClose={onClose} {...props} />)
  return { onSave, onClose }
}

describe('EmployeeFormModal (create)', () => {
  it('opens titled "Cadastrar funcionário" with every field empty', () => {
    renderForm()

    expect(screen.getByRole('dialog', { name: 'Cadastrar funcionário' })).toBeInTheDocument()
    for (const label of ['Nome funcionário', 'Telefone', 'Cargo', 'Horário Entrada', 'Horário saída', 'Usuário', 'Senha']) {
      expect(screen.getByLabelText(label)).toHaveValue('')
    }
  })

  it('saves trimmed values when the required fields are filled', () => {
    const { onSave } = renderForm()

    fill('Nome funcionário', '  Maria Lima ')
    fill('Cargo', 'Operadora')
    fill('Usuário', 'maria')
    fill('Senha', 'Maria123')
    fill('Telefone', '(11) 1')
    fill('Horário Entrada', '08:00')
    fill('Horário saída', '17:00')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith({
      nome: 'Maria Lima',
      telefone: '(11) 1',
      cargo: 'Operadora',
      horarioEntrada: '08:00',
      horarioSaida: '17:00',
      usuario: 'maria',
      senha: 'Maria123',
    })
  })

  it('allows empty telefone and horarios', () => {
    const { onSave } = renderForm()

    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it.each(['Nome funcionário', 'Cargo', 'Usuário', 'Senha'])('blocks the save and flags %s when it is empty', (label) => {
    const { onSave } = renderForm()

    fillRequired()
    fill(label, '   ')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('blocks the save when the usuario belongs to another employee, ignoring case', () => {
    const { onSave } = renderForm()

    fillRequired()
    fill('Usuário', 'ALEXANDREMATTOS')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Este usuário já está em uso')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('aria-invalid', 'true')
  })

  it('toggles the password between hidden and visible with the eye button', () => {
    renderForm()

    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(password).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('closes without saving on Cancelar, the close icon and Escape', () => {
    const { onSave, onClose } = renderForm()

    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(3)
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('EmployeeFormModal (edit)', () => {
  it('opens titled "Editar informações do funcionário" with the employee values', () => {
    renderForm({ employee: alexandre })

    expect(screen.getByRole('dialog', { name: 'Editar informações do funcionário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome funcionário')).toHaveValue('Alexandre Mattos')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(55) 15 999999999')
    expect(screen.getByLabelText('Cargo')).toHaveValue('Ajudante')
    expect(screen.getByLabelText('Horário Entrada')).toHaveValue('08:00')
    expect(screen.getByLabelText('Horário saída')).toHaveValue('17:00')
    expect(screen.getByLabelText('Usuário')).toHaveValue('AlexandreMattos')
    expect(screen.getByLabelText('Senha')).toHaveValue('Alexandre123')
  })

  it('does not report a duplicate when the employee keeps their own usuario', () => {
    const { onSave } = renderForm({ employee: alexandre })

    fill('Cargo', 'Supervisor')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ usuario: 'AlexandreMattos', cargo: 'Supervisor' }))
  })

  it('reports a duplicate when switching to another employee\'s usuario', () => {
    const { onSave } = renderForm({ employee: alexandre })

    fill('Usuário', 'ana')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Este usuário já está em uso')).toBeInTheDocument()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EmployeeFormModal from '../../../components/team/EmployeeFormModal'
import { employee } from '../../fixtures/employees'

const alexandre = employee({
  id: '1',
  matricula: 'EMP-084',
  nome: 'Alexandre Mattos',
  telefone: '(55) 15 999999999',
  cargo: 'Ajudante',
  horarioEntrada: '08:00',
  horarioSaida: '17:00',
  usuario: 'AlexandreMattos',
})
const ana = employee({ ...alexandre, id: '2', matricula: 'EMP-085', nome: 'Ana', usuario: 'ana' })

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

describe('EmployeeFormModal (create) login rules', () => {
  it.each(['maria silva', 'ab'])('flags the usuario "%s": spaces or under 3 characters', (usuario) => {
    const { onSave } = renderForm()

    fillRequired()
    fill('Usuário', usuario)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Use de 3 a 40 caracteres, sem espaços')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuário')).toHaveAttribute('aria-invalid', 'true')
  })

  it('flags a password under 8 characters', () => {
    const { onSave } = renderForm()

    fillRequired()
    fill('Senha', 'Maria12')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
  })
})

describe('EmployeeFormModal (create) branch', () => {
  const branches = [
    { _id: 'f1', nome: 'Matriz', matriz: true },
    { _id: 'f2', nome: 'Unidade Norte', matriz: false },
  ]

  it('asks for the branch with 2+ branches, first one by default', () => {
    const { onSave } = renderForm({ branches })

    expect(screen.getByLabelText('Filial')).toHaveValue('f1')
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ nome: 'Maria Lima', filialId: 'f1' }))
  })

  it('sends the chosen branch', () => {
    const { onSave } = renderForm({ branches })

    fillRequired()
    fireEvent.change(screen.getByLabelText('Filial'), { target: { value: 'f2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ filialId: 'f2' }))
  })

  it('has no branch field with a single branch', () => {
    const { onSave } = renderForm({ branches: [branches[0]] })

    expect(screen.queryByLabelText('Filial')).not.toBeInTheDocument()
    fillRequired()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onSave.mock.calls[0][0]).not.toHaveProperty('filialId')
  })

  it('has no branch field when editing', () => {
    renderForm({ employee: alexandre, branches })

    expect(screen.queryByLabelText('Filial')).not.toBeInTheDocument()
  })
})

describe('EmployeeFormModal (edit, employee with login)', () => {
  it('opens titled "Editar informações do funcionário" with the employee values', () => {
    renderForm({ employee: alexandre })

    expect(screen.getByRole('dialog', { name: 'Editar informações do funcionário' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome funcionário')).toHaveValue('Alexandre Mattos')
    expect(screen.getByLabelText('Telefone')).toHaveValue('(55) 15 999999999')
    expect(screen.getByLabelText('Cargo')).toHaveValue('Ajudante')
    expect(screen.getByLabelText('Horário Entrada')).toHaveValue('08:00')
    expect(screen.getByLabelText('Horário saída')).toHaveValue('17:00')
    expect(screen.getByLabelText('Usuário')).toHaveValue('AlexandreMattos')
    // The API never returns the password, so the field starts empty.
    expect(screen.getByLabelText('Senha')).toHaveValue('')
  })

  it('shows the usuario read-only and hints that an empty password keeps the current one', () => {
    renderForm({ employee: alexandre })

    expect(screen.getByLabelText('Usuário')).toBeDisabled()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('placeholder', 'Deixe em branco para manter a atual')
  })

  it('saves with an empty senha when the password is left blank', () => {
    const { onSave } = renderForm({ employee: alexandre })

    fill('Cargo', 'Supervisor')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ usuario: 'AlexandreMattos', cargo: 'Supervisor', senha: '' })
    )
  })

  it('saves the new password when one is typed', () => {
    const { onSave } = renderForm({ employee: alexandre })

    fill('Senha', 'NovaSenha1')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ senha: 'NovaSenha1' }))
  })

  it('flags a new password under 8 characters', () => {
    const { onSave } = renderForm({ employee: alexandre })

    fill('Senha', 'curta')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('A senha precisa ter pelo menos 8 caracteres')).toBeInTheDocument()
  })
})

describe('EmployeeFormModal (edit, employee without login)', () => {
  const diego = employee({ id: '3', matricula: 'EMP-094', nome: 'Diego Martins', usuario: null, acesso: 'Negado' })

  it('saves without a login when usuario and senha stay empty', () => {
    const { onSave } = renderForm({ employee: diego })

    expect(screen.getByLabelText('Usuário')).toBeEnabled()
    expect(screen.getByLabelText('Usuário')).toHaveValue('')
    fill('Cargo', 'Operador')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ cargo: 'Operador', usuario: '', senha: '' }))
  })

  it('saves usuario and senha together to create the login', () => {
    const { onSave } = renderForm({ employee: diego })

    fill('Usuário', 'diego')
    fill('Senha', 'Diego12345')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ usuario: 'diego', senha: 'Diego12345' }))
  })

  it.each([
    ['Usuário', 'diego', 'Senha'],
    ['Senha', 'Diego12345', 'Usuário'],
  ])('requires the other login field when only %s is filled', (filled, value, missing) => {
    const { onSave } = renderForm({ employee: diego })

    fill(filled, value)
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByLabelText(missing)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it("reports a duplicate when picking another employee's usuario", () => {
    const { onSave } = renderForm({ employee: diego })

    fill('Usuário', 'ana')
    fill('Senha', 'Diego12345')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText('Este usuário já está em uso')).toBeInTheDocument()
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import CategoryFormModal from '../../../components/fleet/CategoryFormModal'

function setup() {
  const handlers = { onSubmit: vi.fn(), onClose: vi.fn() }
  render(<CategoryFormModal existingNames={['Acidentes', 'Reserva']} {...handlers} />)
  return handlers
}

const nameInput = () => screen.getByLabelText('Nome da categoria')
const colorButton = () => screen.getByRole('button', { name: 'Cor da categoria' })
const submit = () => fireEvent.click(screen.getByRole('button', { name: 'Criar Categoria' }))

describe('CategoryFormModal', () => {
  it('renders as a dialog titled Criar Categoria with the blue default color', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Criar Categoria' })).toBeInTheDocument()
    expect(nameInput()).toHaveAttribute('placeholder', 'Nome categoria')
    expect(colorButton()).toHaveAttribute('data-color', '#3A9CFF')
  })

  it('submits the trimmed name and the chosen preset color', () => {
    const { onSubmit } = setup()
    fireEvent.click(colorButton())
    fireEvent.click(screen.getByRole('button', { name: '#3AFF3A' }))
    fireEvent.change(nameInput(), { target: { value: '  Pátio ' } })
    submit()
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Pátio', cor: '#3AFF3A', statusVinculados: [] })
  })

  it('opens a popover with the 7 preset colors and a hex input', () => {
    setup()
    expect(screen.queryByRole('textbox', { name: 'HEX' })).not.toBeInTheDocument()
    fireEvent.click(colorButton())
    for (const color of ['#3A9CFF', '#3AFF3A', '#FFC93A', '#FF7A3A', '#9B3AFF', '#FF3AC4', '#3AE7FF']) {
      expect(screen.getByRole('button', { name: color })).toBeInTheDocument()
    }
    expect(screen.getByRole('textbox', { name: 'HEX' })).toBeInTheDocument()
  })

  it('applies a valid hex and keeps the previous color for an invalid one', () => {
    const { onSubmit } = setup()
    fireEvent.click(colorButton())
    const hex = screen.getByRole('textbox', { name: 'HEX' })
    fireEvent.change(hex, { target: { value: '#123ABC' } })
    expect(colorButton()).toHaveAttribute('data-color', '#123ABC')
    fireEvent.change(hex, { target: { value: '#12' } })
    expect(colorButton()).toHaveAttribute('data-color', '#123ABC')
    fireEvent.change(nameInput(), { target: { value: 'Pátio' } })
    submit()
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Pátio', cor: '#123ABC', statusVinculados: [] })
  })

  it('closes the popover with its close button', () => {
    setup()
    fireEvent.click(colorButton())
    fireEvent.click(screen.getByRole('button', { name: 'Fechar cores' }))
    expect(screen.queryByRole('textbox', { name: 'HEX' })).not.toBeInTheDocument()
  })

  it('shows "Campo obrigatório" for a blank name and does not submit', () => {
    const { onSubmit } = setup()
    fireEvent.change(nameInput(), { target: { value: '   ' } })
    submit()
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('rejects a name that already exists ignoring case and spaces', () => {
    const { onSubmit } = setup()
    fireEvent.change(nameInput(), { target: { value: ' reserva ' } })
    submit()
    expect(screen.getByText('Já existe uma categoria com esse nome')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('limits the name to 30 characters', () => {
    setup()
    expect(nameInput()).toHaveAttribute('maxLength', '30')
  })

  it('closes without submitting on Cancelar, the close icon and Escape', () => {
    const { onSubmit, onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(3)
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('CategoryFormModal linked status and edit mode (CAT-02, CAT-03, CAT-09)', () => {
  const checkbox = (label: string) => screen.getByRole('checkbox', { name: new RegExp(`^${label}`) })

  it('lists the 5 status unchecked when creating', () => {
    setup()
    for (const label of ['Disponível', 'Em uso', 'Em manutenção', 'Alerta', 'Offline']) {
      expect(checkbox(label)).not.toBeChecked()
    }
  })

  it('submits name, color and the checked status', () => {
    const { onSubmit } = setup()
    fireEvent.change(nameInput(), { target: { value: 'Pátio' } })
    fireEvent.click(checkbox('Offline'))
    fireEvent.click(checkbox('Disponível'))
    fireEvent.click(checkbox('Em uso'))
    fireEvent.click(checkbox('Em uso'))
    submit()
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Pátio', cor: '#3A9CFF', statusVinculados: ['disponivel', 'offline'] })
  })

  it('disables a status linked to another category and explains why', () => {
    render(<CategoryFormModal existingNames={[]} takenStatus={['alerta']} onSubmit={vi.fn()} onClose={vi.fn()} />)
    expect(checkbox('Alerta')).toBeDisabled()
    expect(checkbox('Alerta')).toHaveAccessibleDescription('Já ligado a outra categoria')
    expect(checkbox('Offline')).toBeEnabled()
  })

  it('comes filled when editing and saves the changes', () => {
    const onSubmit = vi.fn()
    render(
      <CategoryFormModal
        existingNames={['Reserva']}
        initial={{ nome: 'Pátio', cor: '#FF7A3A', statusVinculados: ['offline'] }}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />
    )
    expect(screen.getByRole('dialog', { name: 'Editar categoria' })).toBeInTheDocument()
    expect(nameInput()).toHaveValue('Pátio')
    expect(colorButton()).toHaveAttribute('data-color', '#FF7A3A')
    expect(checkbox('Offline')).toBeChecked()

    fireEvent.click(checkbox('Offline'))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSubmit).toHaveBeenCalledWith({ nome: 'Pátio', cor: '#FF7A3A', statusVinculados: [] })
  })

  it('keeps the form open with an error when saving fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('409'))
    const onClose = vi.fn()
    render(<CategoryFormModal existingNames={[]} onSubmit={onSubmit} onClose={onClose} />)
    fireEvent.change(nameInput(), { target: { value: 'Pátio' } })
    submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar. Tente novamente.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(nameInput()).toHaveValue('Pátio')
    expect(onClose).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Criar Categoria' })).toBeEnabled())
  })
})

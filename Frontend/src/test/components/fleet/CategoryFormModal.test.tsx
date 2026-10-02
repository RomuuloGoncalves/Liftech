import { fireEvent, render, screen } from '@testing-library/react'
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
    expect(onSubmit).toHaveBeenCalledWith('Pátio', '#3AFF3A')
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
    expect(onSubmit).toHaveBeenCalledWith('Pátio', '#123ABC')
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

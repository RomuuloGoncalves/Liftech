import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NewMachinePanel from '../../../components/machines/NewMachinePanel'

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Empilhadeira'), {
    target: { value: 'Empilhadeira Elétrica Titan-X' },
  })
  fireEvent.change(screen.getByLabelText('Código'), { target: { value: 'EMP-100' } })
}

describe('NewMachinePanel', () => {
  it('renders the title, subtitle and all form fields', () => {
    render(<NewMachinePanel onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Nova Máquina' })).toBeInTheDocument()
    expect(screen.getByText('Cadastre uma nova empilhadeira para a sua frota.')).toBeInTheDocument()
    expect(screen.getByLabelText('Empilhadeira')).toBeInTheDocument()
    expect(screen.getByLabelText('Código')).toBeInTheDocument()
    expect(screen.getByLabelText('Setor')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome Dispositivo')).toBeInTheDocument()
    expect(screen.getByLabelText('Endereço Mac')).toBeInTheDocument()
  })

  it('marks Empilhadeira and Código as required, and the rest as optional', () => {
    render(<NewMachinePanel onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByLabelText('Empilhadeira')).toBeRequired()
    expect(screen.getByLabelText('Código')).toBeRequired()
    expect(screen.getByLabelText('Setor')).not.toBeRequired()
    expect(screen.getByLabelText('Nome Dispositivo')).not.toBeRequired()
    expect(screen.getByLabelText('Endereço Mac')).not.toBeRequired()
  })

  it('calls onCreate with the typed values when the form is submitted with required fields filled', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel onClose={vi.fn()} onCreate={onCreate} />)

    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'Expedição - Bloco B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar Empilhadeira' }))

    expect(onCreate).toHaveBeenCalledWith({
      nome: 'Empilhadeira Elétrica Titan-X',
      identificacao: 'EMP-100',
      setor: 'Expedição - Bloco B',
      nomeDispositivo: '',
      enderecoMac: '',
    })
  })

  it('does not call onCreate when required fields are empty (native validation blocks submit)', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel onClose={vi.fn()} onCreate={onCreate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Criar Empilhadeira' }))

    expect(onCreate).not.toHaveBeenCalled()
  })

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn()
    render(<NewMachinePanel onClose={onClose} onCreate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Cancelar is clicked', () => {
    const onClose = vi.fn()
    render(<NewMachinePanel onClose={onClose} onCreate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<NewMachinePanel onClose={onClose} onCreate={vi.fn()} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked, but not when the panel itself is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<NewMachinePanel onClose={onClose} onCreate={vi.fn()} />)

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    const backdrop = container.firstChild as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NewMachinePanel from '../../../components/machines/NewMachinePanel'
import type { Machine } from '../../../data/machines'

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Nome'), {
    target: { value: 'Empilhadeira Elétrica Titan-X' },
  })
  fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-100' } })
}

describe('NewMachinePanel', () => {
  it('renders the title, subtitle and all form fields', () => {
    render(<NewMachinePanel onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Nova Máquina' })).toBeInTheDocument()
    expect(screen.getByText('Cadastre uma nova empilhadeira para a sua frota.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Setor')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome Dispositivo')).toBeInTheDocument()
    expect(screen.getByLabelText('MAC Address')).toBeInTheDocument()
  })

  it('marks Nome and ID as required, and the rest as optional', () => {
    render(<NewMachinePanel onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByLabelText('Nome')).toBeRequired()
    expect(screen.getByLabelText('ID')).toBeRequired()
    expect(screen.getByLabelText('Setor')).not.toBeRequired()
    expect(screen.getByLabelText('Nome Dispositivo')).not.toBeRequired()
    expect(screen.getByLabelText('MAC Address')).not.toBeRequired()
  })

  it('calls onCreate with the typed values when the form is submitted with required fields filled', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel onClose={vi.fn()} onCreate={onCreate} />)

    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'Expedição - Bloco B' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

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

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

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

describe('NewMachinePanel in edit mode', () => {
  const machine: Machine = {
    id: '4',
    identificacao: 'EMP-084',
    nome: 'Empilhadeira Elétrica Titan-X',
    setor: 'Expedição - Bloco B',
    dispositivoConectado: { enderecoMac: 'AA:BB:CC:DD:EE:FF', status: 'Disponível', nomeDispositivo: 'Mpa-5312' },
    tempoSessaoMinutos: 5,
  }

  it('shows the Editar Máquina title, subtitle and the Figma labels, with the machine values filled in', () => {
    render(<NewMachinePanel machine={machine} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Editar Máquina' })).toBeInTheDocument()
    expect(screen.getByText('Edite as informações de uma empilhadeira da sua frota.')).toBeInTheDocument()
    expect(screen.getByLabelText('Empilhadeira')).toHaveValue('Empilhadeira Elétrica Titan-X')
    expect(screen.getByLabelText('Código')).toHaveValue('EMP-084')
    expect(screen.getByLabelText('Setor')).toHaveValue('Expedição - Bloco B')
    expect(screen.getByLabelText('Nome Dispositivo')).toHaveValue('Mpa-5312')
    expect(screen.getByLabelText('Endereço Mac')).toHaveValue('AA:BB:CC:DD:EE:FF')
    expect(screen.getByRole('button', { name: 'Editar Empilhadeira' })).toBeInTheDocument()
  })

  it('submits the edited values', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel machine={machine} onClose={vi.fn()} onCreate={onCreate} />)

    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 'Recebimento - Bloco A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))

    expect(onCreate).toHaveBeenCalledWith({
      nome: 'Empilhadeira Elétrica Titan-X',
      identificacao: 'EMP-084',
      setor: 'Recebimento - Bloco A',
      nomeDispositivo: 'Mpa-5312',
      enderecoMac: 'AA:BB:CC:DD:EE:FF',
    })
  })

  it('keeps Empilhadeira and Código required', () => {
    render(<NewMachinePanel machine={machine} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByLabelText('Empilhadeira')).toBeRequired()
    expect(screen.getByLabelText('Código')).toBeRequired()
  })

  it('closes without submitting on Cancelar', () => {
    const onClose = vi.fn()
    const onCreate = vi.fn()
    render(<NewMachinePanel machine={machine} onClose={onClose} onCreate={onCreate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onCreate).not.toHaveBeenCalled()
  })
})

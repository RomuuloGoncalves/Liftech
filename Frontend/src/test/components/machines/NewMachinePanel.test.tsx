import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import NewMachinePanel from '../../../components/machines/NewMachinePanel'
import type { Machine } from '../../../data/machines'

const SECTORS = [
  { _id: 's1', nome: 'Expedição - Bloco B', filialId: 'f1', filial: { nome: 'Matriz' } },
  { _id: 's2', nome: 'Recebimento - Bloco A', filialId: 'f1', filial: { nome: 'Matriz' } },
  { _id: 's3', nome: 'Doca Norte', filialId: 'f2', filial: { nome: 'Unidade Norte' } },
]
const optionTexts = (select: HTMLElement) => [...select.querySelectorAll('option')].map((o) => o.textContent)

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText('Nome'), {
    target: { value: 'Empilhadeira Elétrica Titan-X' },
  })
  fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-100' } })
  fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } })
}

describe('NewMachinePanel', () => {
  it('renders the title, subtitle and all form fields', () => {
    render(<NewMachinePanel sectors={SECTORS} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Nova Máquina' })).toBeInTheDocument()
    expect(screen.getByText('Cadastre uma nova empilhadeira para a sua frota.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
    expect(screen.getByLabelText('ID')).toBeInTheDocument()
    expect(screen.getByLabelText('Setor')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome Dispositivo')).toBeInTheDocument()
    expect(screen.getByLabelText('MAC Address')).toBeInTheDocument()
  })

  it('marks Nome, ID and MAC Address as required, and the rest as optional', () => {
    render(<NewMachinePanel sectors={SECTORS} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByLabelText('Nome')).toBeRequired()
    expect(screen.getByLabelText('ID')).toBeRequired()
    expect(screen.getByLabelText('Setor')).not.toBeRequired()
    expect(screen.getByLabelText('Nome Dispositivo')).not.toBeRequired()
    expect(screen.getByLabelText('MAC Address')).toBeRequired()
  })

  it('calls onCreate with the typed values when the form is submitted with required fields filled', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} onClose={vi.fn()} onCreate={onCreate} />)

    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 's1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onCreate).toHaveBeenCalledWith({
      nome: 'Empilhadeira Elétrica Titan-X',
      identificacao: 'EMP-100',
      setorId: 's1',
      nomeDispositivo: '',
      enderecoMac: 'AA:BB:CC:DD:EE',
    })
  })

  it('does not call onCreate when only the MAC Address is empty', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} onClose={vi.fn()} onCreate={onCreate} />)

    fillRequiredFields()
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onCreate).not.toHaveBeenCalled()
  })

  it('does not call onCreate when required fields are empty (native validation blocks submit)', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} onClose={vi.fn()} onCreate={onCreate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onCreate).not.toHaveBeenCalled()
  })

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} onClose={onClose} onCreate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Cancelar is clicked', () => {
    const onClose = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} onClose={onClose} onCreate={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} onClose={onClose} onCreate={vi.fn()} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked, but not when the panel itself is clicked', () => {
    const onClose = vi.fn()
    const { container } = render(<NewMachinePanel sectors={SECTORS} onClose={onClose} onCreate={vi.fn()} />)

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
    setorId: 's1',
    filialId: 'f1',
    status: 'disponivel', categoriaId: null, categoriaTravada: false, dispositivoConectado: { enderecoMac: 'AA:BB:CC:DD:EE:FF', nomeDispositivo: 'Mpa-5312' },
    tempoSessaoMinutos: 5,
  }

  it('shows the Editar Máquina title, subtitle and the Figma labels, with the machine values filled in', () => {
    render(<NewMachinePanel sectors={SECTORS} machine={machine} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Editar Máquina' })).toBeInTheDocument()
    expect(screen.getByText('Edite as informações de uma empilhadeira da sua frota.')).toBeInTheDocument()
    expect(screen.getByLabelText('Empilhadeira')).toHaveValue('Empilhadeira Elétrica Titan-X')
    expect(screen.getByLabelText('Código')).toHaveValue('EMP-084')
    expect(screen.getByLabelText('Setor')).toHaveValue('s1')
    expect(screen.getByLabelText('Nome Dispositivo')).toHaveValue('Mpa-5312')
    expect(screen.getByLabelText('Endereço Mac')).toHaveValue('AA:BB:CC:DD:EE:FF')
    expect(screen.getByRole('button', { name: 'Editar Empilhadeira' })).toBeInTheDocument()
  })

  it('submits the edited values', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} machine={machine} onClose={vi.fn()} onCreate={onCreate} />)

    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 's2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Editar Empilhadeira' }))

    expect(onCreate).toHaveBeenCalledWith({
      nome: 'Empilhadeira Elétrica Titan-X',
      identificacao: 'EMP-084',
      setorId: 's2',
      nomeDispositivo: 'Mpa-5312',
      enderecoMac: 'AA:BB:CC:DD:EE:FF',
    })
  })

  it('keeps Empilhadeira and Código required', () => {
    render(<NewMachinePanel sectors={SECTORS} machine={machine} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByLabelText('Empilhadeira')).toBeRequired()
    expect(screen.getByLabelText('Código')).toBeRequired()
  })

  it('closes without submitting on Cancelar', () => {
    const onClose = vi.fn()
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} machine={machine} onClose={onClose} onCreate={onCreate} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onCreate).not.toHaveBeenCalled()
  })
})

describe('NewMachinePanel branch picker', () => {
  const branches = [
    { _id: 'f1', nome: 'Matriz', matriz: true },
    { _id: 'f2', nome: 'Unidade Norte', matriz: false },
  ]

  it('shows the Filial select with the first branch selected and sends the chosen branch', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} branches={branches} onClose={vi.fn()} onCreate={onCreate} />)

    const select = screen.getByLabelText('Filial')
    expect(select).toHaveValue('f1')
    expect(optionTexts(select)).toEqual(['Matriz', 'Unidade Norte'])

    fillRequiredFields()
    fireEvent.change(select, { target: { value: 'f2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ filialId: 'f2', identificacao: 'EMP-100' }))
  })

  it('submits the first branch when the user does not change it', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} branches={branches} onClose={vi.fn()} onCreate={onCreate} />)

    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ filialId: 'f1' }))
  })

  it('hides the Filial select without branches or with a single branch', () => {
    const { unmount } = render(<NewMachinePanel sectors={SECTORS} onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.queryByLabelText('Filial')).not.toBeInTheDocument()
    unmount()

    render(<NewMachinePanel sectors={SECTORS} branches={[branches[0]]} onClose={vi.fn()} onCreate={vi.fn()} />)
    expect(screen.queryByLabelText('Filial')).not.toBeInTheDocument()
  })

  it('hides the Filial select when editing a machine', () => {
    const machine = {
      id: 'm1', identificacao: 'EMP-081', nome: 'Titan-X', setor: 'Doca', status: 'disponivel',
      categoriaId: null, categoriaTravada: false, alertaEm: null,
      dispositivoConectado: { enderecoMac: 'AA:BB' }, tempoSessaoMinutos: 0,
    } as unknown as Machine
    render(<NewMachinePanel sectors={SECTORS} machine={machine} branches={branches} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.queryByLabelText('Filial')).not.toBeInTheDocument()
  })
})

describe('NewMachinePanel sector select', () => {
  const branches = [
    { _id: 'f1', nome: 'Matriz', matriz: true },
    { _id: 'f2', nome: 'Unidade Norte', matriz: false },
  ]

  it('lists "Sem setor" and the sectors of the form branch, with "Sem setor" picked on create', () => {
    render(<NewMachinePanel sectors={SECTORS} branches={branches} onClose={vi.fn()} onCreate={vi.fn()} />)

    const select = screen.getByLabelText('Setor')
    expect(select).toHaveValue('')
    expect(optionTexts(select)).toEqual(['Sem setor', 'Expedição - Bloco B', 'Recebimento - Bloco A'])
  })

  it('lists the sectors of the default branch when the form has no branch picker', () => {
    render(<NewMachinePanel sectors={SECTORS} defaultFilialId="f2" onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(optionTexts(screen.getByLabelText('Setor'))).toEqual(['Sem setor', 'Doca Norte'])
  })

  it('lists every sector when no branch is known', () => {
    render(<NewMachinePanel sectors={SECTORS} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(optionTexts(screen.getByLabelText('Setor'))).toHaveLength(4)
  })

  it('lists the sectors of the machine branch when editing', () => {
    const machine = {
      id: 'm1', identificacao: 'EMP-081', nome: 'Titan-X', setor: 'Doca Norte', setorId: 's3', filialId: 'f2',
      status: 'disponivel', categoriaId: null, categoriaTravada: false, alertaEm: null,
      dispositivoConectado: { enderecoMac: 'AA:BB' }, tempoSessaoMinutos: 0,
    } as Machine
    render(<NewMachinePanel sectors={SECTORS} machine={machine} onClose={vi.fn()} onCreate={vi.fn()} />)

    const select = screen.getByLabelText('Setor')
    expect(select).toHaveValue('s3')
    expect(optionTexts(select)).toEqual(['Sem setor', 'Doca Norte'])
  })

  it('pre-selects "Sem setor" when editing a machine without sector', () => {
    const machine = {
      id: 'm1', identificacao: 'EMP-081', nome: 'Titan-X', setor: '', setorId: null, filialId: 'f1',
      status: 'disponivel', categoriaId: null, categoriaTravada: false, alertaEm: null,
      dispositivoConectado: { enderecoMac: 'AA:BB' }, tempoSessaoMinutos: 0,
    } as Machine
    render(<NewMachinePanel sectors={SECTORS} machine={machine} onClose={vi.fn()} onCreate={vi.fn()} />)

    expect(screen.getByLabelText('Setor')).toHaveValue('')
  })

  it('clears the picked sector and lists the new branch sectors when the branch changes', () => {
    const onCreate = vi.fn()
    render(<NewMachinePanel sectors={SECTORS} branches={branches} onClose={vi.fn()} onCreate={onCreate} />)

    fireEvent.change(screen.getByLabelText('Setor'), { target: { value: 's1' } })
    fireEvent.change(screen.getByLabelText('Filial'), { target: { value: 'f2' } })

    expect(screen.getByLabelText('Setor')).toHaveValue('')
    expect(optionTexts(screen.getByLabelText('Setor'))).toEqual(['Sem setor', 'Doca Norte'])
    fillRequiredFields()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ filialId: 'f2', setorId: '' }))
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import MachineCard from '../../../components/machines/MachineCard'
import type { Machine } from '../../../data/machines'

const baseMachine: Machine = {
  id: '1',
  identificacao: 'EMP-084',
  nome: 'Empilhadeira Elétrica Titan-X',
  setor: 'Expedição - Bloco B',
  setorId: null,
  status: 'disponivel', categoriaId: null, categoriaTravada: false, dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F7' },
  operadorConectado: { nome: 'Carlos Silva' },
  tempoSessaoMinutos: 34,
}

describe('MachineCard', () => {
  it('renders name, identificacao, setor, endereco mac, status and tempo de sessao', () => {
    render(<MachineCard machine={baseMachine} />)

    expect(screen.getByText('Empilhadeira Elétrica Titan-X')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(screen.getByText('Expedição - Bloco B')).toBeInTheDocument()
    expect(screen.getByText('A2:C9:9B:1D:F7')).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByText('34 minutos')).toBeInTheDocument()
  })

  it('renders setor and MAC as dd preceded by the correct dt, with title on dd (CARD-04)', () => {
    render(<MachineCard machine={baseMachine} />)

    const setorDd = screen.getByText('Expedição - Bloco B')
    expect(setorDd.tagName.toLowerCase()).toBe('dd')
    expect(setorDd.previousElementSibling?.tagName.toLowerCase()).toBe('dt')
    expect(setorDd.previousElementSibling?.textContent).toBe('Setor:')
    expect(setorDd).toHaveAttribute('title', 'Expedição - Bloco B')

    const macDd = screen.getByText('A2:C9:9B:1D:F7')
    expect(macDd.tagName.toLowerCase()).toBe('dd')
    expect(macDd.previousElementSibling?.tagName.toLowerCase()).toBe('dt')
    expect(macDd.previousElementSibling?.textContent).toBe('MAC Address:')
    expect(macDd).toHaveAttribute('title', 'A2:C9:9B:1D:F7')
  })

  it('renders a menu button without opening any content', () => {
    render(<MachineCard machine={baseMachine} />)
    const menuButton = screen.getByRole('button', { name: /mais ações para emp-084/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('does not show the operador on the card, as in the Figma card', () => {
    render(<MachineCard machine={baseMachine} />)
    expect(screen.queryByText('Carlos Silva')).not.toBeInTheDocument()
  })

  it('does not crash when operadorConectado is absent', () => {
    const machineWithoutOperador: Machine = { ...baseMachine, operadorConectado: undefined }
    expect(() => render(<MachineCard machine={machineWithoutOperador} />)).not.toThrow()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
  })

  it('calls onOpen with the machine when the card title button is clicked', () => {
    const onOpen = vi.fn()
    render(<MachineCard machine={baseMachine} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Empilhadeira Elétrica Titan-X' }))
    expect(onOpen).toHaveBeenCalledWith(baseMachine)
  })

  it('does not call onOpen when the menu button is clicked', () => {
    const onOpen = vi.fn()
    render(<MachineCard machine={baseMachine} onOpen={onOpen} />)

    fireEvent.click(screen.getByRole('button', { name: /mais ações para emp-084/i }))
    expect(onOpen).not.toHaveBeenCalled()
  })

  it('renders no open button when onOpen is not given', () => {
    render(<MachineCard machine={baseMachine} />)

    expect(screen.queryByRole('button', { name: /ver detalhes/i })).not.toBeInTheDocument()
  })
})

describe('MachineCard status classes (RST-06)', () => {
  it.each([
    ['manutencao', 'Em manutenção', 'manutencao'],
    ['em_uso', 'Em uso', 'em_uso'],
    ['disponivel', 'Disponível', 'disponivel'],
    ['offline', 'Offline', 'offline'],
    ['alerta', 'Alerta', 'alerta'],
  ] as const)('maps %s to %s', (status, label, cls) => {
    render(<MachineCard machine={{ ...baseMachine, status }} />)
    expect(screen.getByText(label).className).toContain(cls)
  })
})

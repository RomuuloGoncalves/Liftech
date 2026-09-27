import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MachineCard from '../../../components/machines/MachineCard'
import type { Machine } from '../../../data/machines'

const baseMachine: Machine = {
  id: '1',
  identificacao: 'EMP-084',
  nome: 'Empilhadeira Elétrica Titan-X',
  setor: 'Expedição - Bloco B',
  dispositivoConectado: { enderecoMac: 'A2:C9:9B:1D:F7', status: 'Disponível' },
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

  it('renders a menu button without opening any content', () => {
    render(<MachineCard machine={baseMachine} />)
    const menuButton = screen.getByRole('button', { name: /mais ações para emp-084/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('renders the operador name when operadorConectado is present', () => {
    render(<MachineCard machine={baseMachine} />)
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument()
  })

  it('does not crash and omits operador line when operadorConectado is absent', () => {
    const machineWithoutOperador: Machine = { ...baseMachine, operadorConectado: undefined }
    expect(() => render(<MachineCard machine={machineWithoutOperador} />)).not.toThrow()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Silva')).not.toBeInTheDocument()
  })
})

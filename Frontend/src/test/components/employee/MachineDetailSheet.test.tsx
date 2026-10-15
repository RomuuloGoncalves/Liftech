import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MachineDetailSheet from '../../../components/employee/MachineDetailSheet'
import { MACHINES } from '../../../data/machines'
import { ToastProvider } from '../../../components/common/Toast'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { sessionService } from '../../../services/sessionService'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn() },
}))

const atual = vi.mocked(sessionService.atual)
const iniciar = vi.mocked(sessionService.iniciar)

const sessao = (machineId: string) => ({
  _id: 's1',
  machineId,
  maquina: { nome: 'Titan-X', identificacao: 'EMP-083', setor: 'Recebimento' },
  operador: { nome: 'Carlos' },
  inicio: new Date().toISOString(),
  fim: null,
})

const machine = (id: string) => MACHINES.find((item) => item.id === id)!

const setup = (id: string, onClose = () => {}) =>
  render(
    <ToastProvider>
    <MemoryRouter initialEntries={['/funcionario/maquinas']}>
      <Routes>
        <Route path="/funcionario/maquinas" element={<MachineDetailSheet machine={machine(id)} onClose={onClose} />} />
        <Route path="/funcionario/sessao" element={<p>pagina da sessao</p>} />
      </Routes>
    </MemoryRouter>
    </ToastProvider>
  )

const dialog = () => screen.getByRole('dialog', { name: 'Selecionar Máquina' })
const activate = () => within(dialog()).getByRole('button', { name: /Ativar máquina/ })

beforeEach(() => {
  resetWorkSession()
  atual.mockReset().mockResolvedValue(null)
  iniciar.mockReset()
})

describe('MachineDetailSheet', () => {
  it('shows name, MAC, code, sector and device name', () => {
    setup('1')
    const d = within(dialog())
    expect(d.getByRole('heading', { name: 'Empilhadeira Elétrica Titan-X' })).toBeInTheDocument()
    expect(d.getByText('Mac: A2:C9:9B:1D:F7')).toBeInTheDocument()
    expect(d.getByText('Código: EMP-081')).toBeInTheDocument()
    expect(d.getByText('Expedição - Bloco B')).toBeInTheDocument()
    expect(d.getByText('Mpa-5300')).toBeInTheDocument()
  })

  it('lists the 4 usage records of the machine, with operator and time range', () => {
    setup('1')
    const d = within(dialog())
    expect(d.getAllByRole('listitem')).toHaveLength(4)
    expect(d.getAllByText('Alexandre Gomes')).toHaveLength(4)
    expect(d.getByText('14:35:25 – 16:35:20 (2h 00min)')).toBeInTheDocument()
  })

  it('narrows the history by period', () => {
    setup('1')
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2025-09-13' } })
    expect(within(dialog()).getAllByRole('listitem')).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2025-09-14' } })
    expect(within(dialog()).getAllByRole('listitem')).toHaveLength(1)
  })

  it('shows the empty message for an inverted period', () => {
    setup('1')
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2025-01-01' } })
    expect(within(dialog()).queryByRole('listitem')).not.toBeInTheDocument()
    expect(within(dialog()).getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows the empty message for a machine without records', () => {
    setup('9')
    expect(within(dialog()).getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('calls onClose from Cancelar', () => {
    let closed = 0
    setup('1', () => closed++)
    const cancel = within(dialog()).getAllByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancel[cancel.length - 1])
    expect(closed).toBe(1)
  })

  it('starts the session through the API and goes to /funcionario/sessao on Ativar máquina', async () => {
    iniciar.mockResolvedValue(sessao('3'))
    setup('3')
    expect(activate()).toBeEnabled()
    await act(async () => {
      fireEvent.click(activate())
    })
    expect(iniciar).toHaveBeenCalledWith('3')
    expect(screen.getByText('pagina da sessao')).toBeInTheDocument()
  })

  it('stays on the sheet and shows the error toast when starting fails', async () => {
    iniciar.mockRejectedValue(new Error('409'))
    setup('3')
    await act(async () => {
      fireEvent.click(activate())
    })
    expect(screen.queryByText('pagina da sessao')).not.toBeInTheDocument()
    expect(screen.getByText('Não foi possível iniciar a sessão. Tente novamente.')).toBeInTheDocument()
  })

  it('disables Ativar máquina while a session is active', async () => {
    atual.mockResolvedValue(sessao('3'))
    setup('1')
    await act(async () => {})
    expect(activate()).toBeDisabled()
    expect(within(dialog()).getByText('Você já tem uma sessão em andamento.')).toBeInTheDocument()
    fireEvent.click(activate())
    expect(iniciar).not.toHaveBeenCalled()
  })

  it('does not activate a machine that is not available', () => {
    setup('2')
    expect(activate()).toBeDisabled()
    fireEvent.click(activate())
    expect(iniciar).not.toHaveBeenCalled()
  })
})

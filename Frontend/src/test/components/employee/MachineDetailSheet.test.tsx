import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MachineDetailSheet from '../../../components/employee/MachineDetailSheet'
import { MACHINES } from '../../../data/machines'
import { ToastProvider } from '../../../components/common/Toast'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { sessionService } from '../../../services/sessionService'
import { listSessions } from '../../fixtures/employeeSessions'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn() },
}))

const atual = vi.mocked(sessionService.atual)
const iniciar = vi.mocked(sessionService.iniciar)
const listar = vi.mocked(sessionService.listar)
const loaded = () => act(async () => {})

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
  listar.mockReset().mockImplementation(listSessions)
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

  it('lists the 4 API sessions of the machine, with operator and time range', async () => {
    setup('1')
    await loaded()
    const d = within(dialog())
    expect(d.getAllByRole('listitem')).toHaveLength(4)
    expect(d.getAllByText('Alexandre Gomes')).toHaveLength(4)
    expect(d.getByText('14:35:25 – 16:35:20 (2h 00min)')).toBeInTheDocument()
    expect(listar).toHaveBeenCalledWith({ machineId: '1', from: undefined, to: undefined })
  })

  it('narrows the history by period', async () => {
    setup('1')
    await loaded()
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2025-09-13' } })
    await loaded()
    expect(listar).toHaveBeenLastCalledWith({ machineId: '1', from: '2025-09-13', to: undefined })
    expect(within(dialog()).getAllByRole('listitem')).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2025-09-14' } })
    await loaded()
    expect(within(dialog()).getAllByRole('listitem')).toHaveLength(1)
  })

  it('shows the empty message for an inverted period', async () => {
    setup('1')
    await loaded()
    fireEvent.change(screen.getByLabelText('Data inicial'), { target: { value: '2026-01-01' } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2025-01-01' } })
    await loaded()
    expect(within(dialog()).queryByRole('listitem')).not.toBeInTheDocument()
    expect(within(dialog()).getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows the empty message for a machine without records', async () => {
    setup('9')
    await loaded()
    expect(within(dialog()).getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows the empty message, not invented records, when the API fails', async () => {
    listar.mockRejectedValue(new Error('500'))
    setup('1')
    await loaded()
    expect(within(dialog()).queryByRole('listitem')).not.toBeInTheDocument()
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

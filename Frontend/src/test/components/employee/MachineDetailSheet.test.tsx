import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MachineDetailSheet from '../../../components/employee/MachineDetailSheet'
import { MACHINES } from '../../../data/machines'
import { SESSION_STORAGE_KEY } from '../../../hooks/useWorkSession'

const machine = (id: string) => MACHINES.find((item) => item.id === id)!

const setup = (id: string, onClose = () => {}) =>
  render(
    <MemoryRouter initialEntries={['/funcionario/maquinas']}>
      <Routes>
        <Route path="/funcionario/maquinas" element={<MachineDetailSheet machine={machine(id)} onClose={onClose} />} />
        <Route path="/funcionario/sessao" element={<p>pagina da sessao</p>} />
      </Routes>
    </MemoryRouter>
  )

const dialog = () => screen.getByRole('dialog', { name: 'Selecionar Máquina' })
const activate = () => within(dialog()).getByRole('button', { name: /Ativar máquina/ })

beforeEach(() => sessionStorage.clear())

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

  it('starts the session and goes to /funcionario/sessao on Ativar máquina', () => {
    setup('1')
    expect(activate()).toBeEnabled()
    fireEvent.click(activate())
    expect(screen.getByText('pagina da sessao')).toBeInTheDocument()
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)!).machineId).toBe('1')
  })

  it('disables Ativar máquina while a session is active', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ machineId: '3', startedAt: Date.now() }))
    setup('1')
    expect(activate()).toBeDisabled()
    expect(within(dialog()).getByText('Você já tem uma sessão em andamento.')).toBeInTheDocument()
    fireEvent.click(activate())
    expect(JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)!).machineId).toBe('3')
  })

  it('does not activate a machine that is not available', () => {
    setup('2')
    expect(activate()).toBeDisabled()
    fireEvent.click(activate())
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull()
  })
})

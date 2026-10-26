import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import EmployeeMachinesPage from '../../../pages/employee/EmployeeMachinesPage'
import { MACHINES } from '../../fixtures/machines'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { machineService } from '../../../services/machineService'
import { sessionService } from '../../../services/sessionService'
import { listSessions } from '../../fixtures/employeeSessions'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn() },
}))
vi.mock('../../../services/machineService', () => ({ machineService: { listar: vi.fn() } }))

const listarSessoes = vi.mocked(sessionService.listar)
const listarMaquinas = vi.mocked(machineService.listar)
const loaded = () => act(async () => {})

beforeEach(() => {
  resetWorkSession()
  vi.mocked(sessionService.atual).mockResolvedValue(null)
  listarSessoes.mockReset().mockImplementation(listSessions)
  listarMaquinas.mockReset().mockResolvedValue(MACHINES)
})

const Where = () => <p data-testid="where">{useLocation().pathname}</p>

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/funcionario/maquinas" element={<EmployeeMachinesPage />} />
        <Route path="/funcionario/maquinas/:id" element={<EmployeeMachinesPage />} />
        <Route path="/funcionario/sessao" element={<p>sessao</p>} />
      </Routes>
      <Where />
    </MemoryRouter>
  )

const cards = () => screen.getAllByRole('article')

describe('EmployeeMachinesPage', () => {
  it('shows the title, subtitle and search placeholder', async () => {
    renderAt('/funcionario/maquinas')
    await loaded()
    expect(screen.getByRole('heading', { level: 1, name: 'Máquinas disponíveis' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Procurar Máquina ou setor')).toBeInTheDocument()
  })

  it('lists only the 6 available machines from the API, with date and time when they were used', async () => {
    renderAt('/funcionario/maquinas')
    await loaded()
    expect(listarMaquinas).toHaveBeenCalledTimes(1)
    expect(cards()).toHaveLength(6)
    cards().forEach((card) => expect(within(card).getByText('Disponível')).toBeInTheDocument())
    // Only EMP-083 and EMP-088 (ids 3 and 8) have sessions in the fixture.
    expect(screen.getAllByText('Data e Hora')).toHaveLength(2)
    expect(screen.queryByText('Manutenção')).not.toBeInTheDocument()
    expect(screen.queryByText('Em uso')).not.toBeInTheDocument()
  })

  it('shows the empty message when the API has no machine', async () => {
    listarMaquinas.mockResolvedValue([])
    renderAt('/funcionario/maquinas')
    await loaded()
    expect(screen.getByText('Nenhuma empilhadeira disponível encontrada')).toBeInTheDocument()
  })

  it('filters by identification, ignoring case', async () => {
    renderAt('/funcionario/maquinas')
    await loaded()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'emp-083' } })
    expect(cards()).toHaveLength(1)
    expect(within(cards()[0]).getByText('EMP-083')).toBeInTheDocument()
  })

  it('filters by sector', async () => {
    renderAt('/funcionario/maquinas')
    await loaded()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'recebimento' } })
    expect(cards()).toHaveLength(3)
  })

  it('shows the empty message when nothing matches', async () => {
    renderAt('/funcionario/maquinas')
    await loaded()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz' } })
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.getByText('Nenhuma empilhadeira disponível encontrada')).toBeInTheDocument()
  })

  it('does not match a machine under maintenance', async () => {
    renderAt('/funcionario/maquinas')
    await loaded()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'EMP-084' } })
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('opens the sheet on Selecionar and navigates to the machine route', async () => {
    renderAt('/funcionario/maquinas')
    await loaded()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(within(cards()[0]).getByRole('button', { name: /Selecionar/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/maquinas/3')
    expect(screen.getByRole('dialog', { name: 'Selecionar Máquina' })).toBeInTheDocument()
  })

  it('opens the sheet straight from the route, for a machine that is not available', async () => {
    renderAt('/funcionario/maquinas/4')
    await loaded()
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Código: EMP-084')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Ativar máquina/ })).toBeDisabled()
  })

  it('renders only the list for an unknown id', async () => {
    renderAt('/funcionario/maquinas/999')
    await loaded()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cards()).toHaveLength(6)
  })

  it('closes the sheet on Cancelar, keeping the list', async () => {
    renderAt('/funcionario/maquinas/3')
    await loaded()
    const dialog = screen.getByRole('dialog')
    const cancel = within(dialog).getAllByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancel[cancel.length - 1])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/funcionario\/maquinas$/)
    expect(cards()).toHaveLength(6)
  })
})

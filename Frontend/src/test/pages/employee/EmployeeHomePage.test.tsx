import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EmployeeHomePage from '../../../pages/employee/EmployeeHomePage'
import { filterAvailableMachines } from '../../../data/employeeArea'
import { MACHINES } from '../../../data/machines'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { machineService } from '../../../services/machineService'
import { sessionService } from '../../../services/sessionService'
import { listSessions, sessao } from '../../fixtures/employeeSessions'

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

const Where = () => <output data-testid="where">{useLocation().pathname}</output>

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/funcionario']}>
      <EmployeeHomePage />
      <Where />
    </MemoryRouter>
  )

describe('EmployeeHomePage', () => {
  it('shows title and subtitle', async () => {
    setup()
    await loaded()
    expect(screen.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument()
    expect(
      screen.getByText('Acompanhe suas últimas atualizações e consulte as máquinas disponíveis para utilização.')
    ).toBeInTheDocument()
  })

  it('shows the last machine banner from the most recent API session', async () => {
    listarSessoes.mockResolvedValue([sessao('4', '2026-09-05', '10:00:00', '11:00:00'), sessao('1', '2026-09-01', '10:00:00', null)])
    setup()
    await loaded()
    const banner = within(screen.getByRole('region', { name: 'Última máquina' }))
    expect(banner.getByText('Última máquina')).toBeInTheDocument()
    expect(banner.getByText('Empilhadeira Elétrica Titan-X')).toBeInTheDocument()
    expect(banner.getByText('EMP-084')).toBeInTheDocument()
    expect(banner.getByText('5 Setembro 2026')).toBeInTheDocument()
    expect(banner.getByText('Tempo total')).toBeInTheDocument()
  })

  it('hides the last machine banner without sessions', async () => {
    listarSessoes.mockResolvedValue([])
    setup()
    await loaded()
    expect(screen.queryByText('Última máquina')).not.toBeInTheDocument()
  })

  it('shows no machine card when the API has no available machine', async () => {
    listarMaquinas.mockResolvedValue(MACHINES.filter((m) => m.status !== 'disponivel'))
    setup()
    await loaded()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('shows the two workday cards', async () => {
    setup()
    await loaded()
    expect(screen.getByText('Jornada de trabalho')).toBeInTheDocument()
    expect(screen.getByText('Das 8h às 17h')).toBeInTheDocument()
    expect(screen.getByText('Jornada diária de 8 horas.')).toBeInTheDocument()
    expect(screen.getByText('Tempo restante da jornada')).toBeInTheDocument()
    expect(screen.getByText('04 Horas')).toBeInTheDocument()
  })

  it('lists at most 3 available machines', async () => {
    setup()
    await loaded()
    expect(screen.getByText('Empilhadeiras disponíveis')).toBeInTheDocument()
    expect(filterAvailableMachines(MACHINES, '').length).toBeGreaterThan(3)
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /selecionar/i })).toHaveLength(3)
  })

  it('"Mais" goes to the machines list', async () => {
    setup()
    await loaded()
    fireEvent.click(screen.getByRole('link', { name: /mais/i }))
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/maquinas')
  })

  it('"Selecionar" opens the machine detail', async () => {
    setup()
    await loaded()
    const first = filterAvailableMachines(MACHINES, '')[0]
    fireEvent.click(screen.getAllByRole('button', { name: /selecionar/i })[0])
    expect(screen.getByTestId('where')).toHaveTextContent(`/funcionario/maquinas/${first.id}`)
  })
})

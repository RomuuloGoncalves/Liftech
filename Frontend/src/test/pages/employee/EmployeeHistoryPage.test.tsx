import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EmployeeHistoryPage from '../../../pages/employee/EmployeeHistoryPage'
import { MACHINES } from '../../../data/machines'
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

const Where = () => <output data-testid="where">{useLocation().pathname}</output>

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/funcionario/historico']}>
      <Routes>
        <Route path="/funcionario/historico" element={<EmployeeHistoryPage />} />
        <Route path="/funcionario/maquinas/:id" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )

const cards = () => screen.queryAllByRole('article')
const set = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('EmployeeHistoryPage', () => {
  it('shows title, subtitle and the 4 filters', async () => {
    setup()
    await loaded()
    expect(screen.getByRole('heading', { level: 1, name: 'Histórico' })).toBeInTheDocument()
    expect(screen.getByText(/Consulte seus usos anteriores/)).toBeInTheDocument()
    expect(screen.getByText('Filtros')).toBeInTheDocument()
    expect(screen.getByLabelText('Data inicial')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Data final')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Hora')).toHaveAttribute('type', 'time')
    expect(screen.getByLabelText('Hora final')).toHaveAttribute('type', 'time')
    expect(screen.getByPlaceholderText('Procurar Máquina')).toBeInTheDocument()
  })

  it('lists one card per session from the API', async () => {
    setup()
    await loaded()
    expect(listarSessoes).toHaveBeenCalledWith()
    expect(cards()).toHaveLength(32)
  })

  it('shows the empty message when the API has no session', async () => {
    listarSessoes.mockResolvedValue([])
    setup()
    await loaded()
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument()
  })

  it('period restricts the list', async () => {
    setup()
    await loaded()
    set('Data inicial', '2025-09-14')
    expect(cards()).toHaveLength(8)
    set('Data final', '2025-09-14')
    expect(cards()).toHaveLength(8)
  })

  it('start time restricts the list', async () => {
    setup()
    await loaded()
    set('Hora', '13:00')
    expect(cards()).toHaveLength(16)
  })

  it('end time restricts the list', async () => {
    setup()
    await loaded()
    set('Hora final', '09:30')
    expect(cards()).toHaveLength(16)
  })

  it('machine search restricts the list', async () => {
    setup()
    await loaded()
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'EMP-084' } })
    expect(cards()).toHaveLength(4)
  })

  it('combination of filters restricts further', async () => {
    setup()
    await loaded()
    set('Data inicial', '2025-09-14')
    set('Hora', '13:00')
    expect(cards()).toHaveLength(4)
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'EMP-084' } })
    expect(cards()).toHaveLength(0)
    set('Hora', '')
    expect(cards()).toHaveLength(1)
  })

  it('inverted period shows the empty message', async () => {
    setup()
    await loaded()
    set('Data inicial', '2025-09-14')
    set('Data final', '2025-09-08')
    expect(cards()).toHaveLength(0)
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument()
  })

  it('no match shows the empty message', async () => {
    setup()
    await loaded()
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'zzzz' } })
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument()
  })

  it('More details navigates to the machine route', async () => {
    setup()
    await loaded()
    set('Data inicial', '2025-09-14')
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'EMP-084' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Mais detalhes/ })[0])
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/maquinas/4')
  })
})

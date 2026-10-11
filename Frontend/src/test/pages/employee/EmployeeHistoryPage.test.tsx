import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import EmployeeHistoryPage from '../../../pages/employee/EmployeeHistoryPage'

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
  it('shows title, subtitle and the 4 filters', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Histórico' })).toBeInTheDocument()
    expect(screen.getByText(/Consulte seus usos anteriores/)).toBeInTheDocument()
    expect(screen.getByText('Filtros')).toBeInTheDocument()
    expect(screen.getByLabelText('Data inicial')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Data final')).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText('Hora')).toHaveAttribute('type', 'time')
    expect(screen.getByLabelText('Hora final')).toHaveAttribute('type', 'time')
    expect(screen.getByPlaceholderText('Procurar Máquina')).toBeInTheDocument()
  })

  it('lists one card per usage record', () => {
    setup()
    expect(cards()).toHaveLength(32)
  })

  it('period restricts the list', () => {
    setup()
    set('Data inicial', '2025-09-14')
    expect(cards()).toHaveLength(8)
    set('Data final', '2025-09-14')
    expect(cards()).toHaveLength(8)
  })

  it('start time restricts the list', () => {
    setup()
    set('Hora', '13:00')
    expect(cards()).toHaveLength(16)
  })

  it('end time restricts the list', () => {
    setup()
    set('Hora final', '09:30')
    expect(cards()).toHaveLength(16)
  })

  it('machine search restricts the list', () => {
    setup()
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'EMP-084' } })
    expect(cards()).toHaveLength(4)
  })

  it('combination of filters restricts further', () => {
    setup()
    set('Data inicial', '2025-09-14')
    set('Hora', '13:00')
    expect(cards()).toHaveLength(4)
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'EMP-084' } })
    expect(cards()).toHaveLength(0)
    set('Hora', '')
    expect(cards()).toHaveLength(1)
  })

  it('inverted period shows the empty message', () => {
    setup()
    set('Data inicial', '2025-09-14')
    set('Data final', '2025-09-08')
    expect(cards()).toHaveLength(0)
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument()
  })

  it('no match shows the empty message', () => {
    setup()
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'zzzz' } })
    expect(screen.getByText('Nenhum registro encontrado')).toBeInTheDocument()
  })

  it('More details navigates to the machine route', () => {
    setup()
    set('Data inicial', '2025-09-14')
    fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value: 'EMP-084' } })
    fireEvent.click(screen.getAllByRole('button', { name: /Mais detalhes/ })[0])
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/maquinas/4')
  })
})

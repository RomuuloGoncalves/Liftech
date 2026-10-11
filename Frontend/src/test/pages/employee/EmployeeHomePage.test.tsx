import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import EmployeeHomePage from '../../../pages/employee/EmployeeHomePage'
import { MACHINES } from '../../../data/machines'
import { filterAvailableMachines } from '../../../data/employeeArea'

const Where = () => <output data-testid="where">{useLocation().pathname}</output>

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/funcionario']}>
      <EmployeeHomePage />
      <Where />
    </MemoryRouter>
  )

describe('EmployeeHomePage', () => {
  it('shows title and subtitle', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument()
    expect(
      screen.getByText('Acompanhe suas últimas atualizações e consulte as máquinas disponíveis para utilização.')
    ).toBeInTheDocument()
  })

  it('shows the last machine banner with name, identification and date', () => {
    setup()
    expect(screen.getByText('Última máquina')).toBeInTheDocument()
    expect(screen.getByText('Empilhadeira elétrica Tital-X')).toBeInTheDocument()
    expect(screen.getByText('EMP-084')).toBeInTheDocument()
    expect(screen.getByText('5 Setembro 2026')).toBeInTheDocument()
    expect(screen.getByText('Tempo total')).toBeInTheDocument()
  })

  it('shows the two workday cards', () => {
    setup()
    expect(screen.getByText('Jornada de trabalho')).toBeInTheDocument()
    expect(screen.getByText('Das 8h às 17h')).toBeInTheDocument()
    expect(screen.getByText('Jornada diária de 8 horas.')).toBeInTheDocument()
    expect(screen.getByText('Tempo restante da jornada')).toBeInTheDocument()
    expect(screen.getByText('04 Horas')).toBeInTheDocument()
  })

  it('lists at most 3 available machines', () => {
    setup()
    expect(screen.getByText('Empilhadeiras disponíveis')).toBeInTheDocument()
    expect(filterAvailableMachines(MACHINES, '').length).toBeGreaterThan(3)
    expect(screen.getAllByRole('article')).toHaveLength(3)
    expect(screen.getAllByRole('button', { name: /selecionar/i })).toHaveLength(3)
  })

  it('"Mais" goes to the machines list', () => {
    setup()
    fireEvent.click(screen.getByRole('link', { name: /mais/i }))
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/maquinas')
  })

  it('"Selecionar" opens the machine detail', () => {
    setup()
    const first = filterAvailableMachines(MACHINES, '')[0]
    fireEvent.click(screen.getAllByRole('button', { name: /selecionar/i })[0])
    expect(screen.getByTestId('where')).toHaveTextContent(`/funcionario/maquinas/${first.id}`)
  })
})

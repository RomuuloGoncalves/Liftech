import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import EmployeeMachinesPage from '../../../pages/employee/EmployeeMachinesPage'

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

beforeEach(() => sessionStorage.clear())

describe('EmployeeMachinesPage', () => {
  it('shows the title, subtitle and search placeholder', () => {
    renderAt('/funcionario/maquinas')
    expect(screen.getByRole('heading', { level: 1, name: 'Máquinas disponíveis' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Procurar Máquina ou setor')).toBeInTheDocument()
  })

  it('lists only the 9 available machines, each with date and time', () => {
    renderAt('/funcionario/maquinas')
    expect(cards()).toHaveLength(9)
    cards().forEach((card) => {
      expect(within(card).getByText('Disponível')).toBeInTheDocument()
      expect(within(card).getByText('Data e Hora')).toBeInTheDocument()
    })
    expect(screen.queryByText('Manutenção')).not.toBeInTheDocument()
    expect(screen.queryByText('Em uso')).not.toBeInTheDocument()
  })

  it('filters by identification, ignoring case', () => {
    renderAt('/funcionario/maquinas')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'emp-085' } })
    expect(cards()).toHaveLength(1)
    expect(within(cards()[0]).getByText('EMP-085')).toBeInTheDocument()
  })

  it('filters by sector', () => {
    renderAt('/funcionario/maquinas')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'recebimento' } })
    expect(cards()).toHaveLength(3)
  })

  it('shows the empty message when nothing matches', () => {
    renderAt('/funcionario/maquinas')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzzz' } })
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
    expect(screen.getByText('Nenhuma empilhadeira disponível encontrada')).toBeInTheDocument()
  })

  it('does not match a machine under maintenance', () => {
    renderAt('/funcionario/maquinas')
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'EMP-084' } })
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })

  it('opens the sheet on Selecionar and navigates to the machine route', () => {
    renderAt('/funcionario/maquinas')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(within(cards()[0]).getByRole('button', { name: /Selecionar/ }))
    expect(screen.getByTestId('where')).toHaveTextContent('/funcionario/maquinas/1')
    expect(screen.getByRole('dialog', { name: 'Selecionar Máquina' })).toBeInTheDocument()
  })

  it('opens the sheet straight from the route, for a machine that is not available', () => {
    renderAt('/funcionario/maquinas/4')
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('Código: EMP-084')).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /Ativar máquina/ })).toBeDisabled()
  })

  it('renders only the list for an unknown id', () => {
    renderAt('/funcionario/maquinas/999')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cards()).toHaveLength(9)
  })

  it('closes the sheet on Cancelar, keeping the list', () => {
    renderAt('/funcionario/maquinas/1')
    const dialog = screen.getByRole('dialog')
    const cancel = within(dialog).getAllByRole('button', { name: 'Cancelar' })
    fireEvent.click(cancel[cancel.length - 1])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/funcionario\/maquinas$/)
    expect(cards()).toHaveLength(9)
  })
})

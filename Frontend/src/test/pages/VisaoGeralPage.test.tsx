import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VisaoGeralPage from '../../pages/VisaoGeralPage'
import { MACHINES } from '../../data/machines'

describe('VisaoGeralPage', () => {
  it('renders one card per machine in the mock dataset', () => {
    render(<VisaoGeralPage />)
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('renders the Cadastrar Máquina button and the search field', () => {
    render(<VisaoGeralPage />)
    expect(screen.getByRole('button', { name: /cadastrar máquina/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('filters cards by identificação/setor as the user types in the search field', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'EMP-084' } })

    expect(screen.getAllByRole('article')).toHaveLength(1)
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
  })

  it('shows all machines again after the search field is cleared', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'EMP-084' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)

    fireEvent.change(search, { target: { value: '' } })
    expect(screen.getAllByRole('article')).toHaveLength(MACHINES.length)
  })

  it('keeps the active status filter applied after the search field is cleared', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')
    const select = screen.getByRole('combobox', { name: /filtrar máquinas por status/i })

    fireEvent.change(select, { target: { value: 'Manutenção' } })
    fireEvent.change(search, { target: { value: 'EMP-084' } })
    expect(screen.getAllByRole('article')).toHaveLength(1)

    fireEvent.change(search, { target: { value: '' } })

    const expectedCount = MACHINES.filter(
      (machine) => machine.dispositivoConectado.status === 'Manutenção'
    ).length
    expect(screen.getAllByRole('article')).toHaveLength(expectedCount)
  })

  it('filters cards by status when a status is selected in the filter', () => {
    render(<VisaoGeralPage />)
    const select = screen.getByRole('combobox', { name: /filtrar máquinas por status/i })

    fireEvent.change(select, { target: { value: 'Manutenção' } })

    const expectedCount = MACHINES.filter(
      (machine) => machine.dispositivoConectado.status === 'Manutenção'
    ).length
    expect(screen.getAllByRole('article')).toHaveLength(expectedCount)
  })

  it('shows the empty state message when search + filter match nothing', () => {
    render(<VisaoGeralPage />)
    const search = screen.getByPlaceholderText('Search...')

    fireEvent.change(search, { target: { value: 'inexistente-xyz' } })

    expect(screen.queryAllByRole('article')).toHaveLength(0)
    expect(screen.getByText('Nenhuma máquina encontrada')).toBeInTheDocument()
  })
})

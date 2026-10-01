import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SectorCard from '../../../components/team/SectorCard'

const sector = { id: '1', nome: 'Doca de Carga', unidade: 'Unidade Centro' }

function setup() {
  const handlers = { onOpen: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
  render(<SectorCard sector={sector} {...handlers} />)
  return handlers
}

describe('SectorCard', () => {
  it('shows the sector name', () => {
    setup()
    expect(screen.getByText('Doca de Carga')).toBeInTheDocument()
  })

  it('calls onOpen when the card body is clicked', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalhes de Doca de Carga' }))
    expect(h.onOpen).toHaveBeenCalledWith(sector)
  })

  it('calls onEdit from the pencil without opening the details', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Doca de Carga' }))
    expect(h.onEdit).toHaveBeenCalledWith(sector)
    expect(h.onOpen).not.toHaveBeenCalled()
  })

  it('calls onDelete from the trash without opening the details', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Doca de Carga' }))
    expect(h.onDelete).toHaveBeenCalledWith(sector)
    expect(h.onOpen).not.toHaveBeenCalled()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SectorCard from '../../../components/team/SectorCard'

const sector = { _id: '1', nome: 'Doca de Carga', filialId: 'f2', filial: { nome: 'Unidade Centro' } }

function setup() {
  const handlers = { onOpen: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
  render(<SectorCard sector={sector} {...handlers} />)
  return handlers
}

describe('SectorCard', () => {
  it('shows the sector name and its branch name', () => {
    setup()
    expect(screen.getByText('Doca de Carga')).toBeInTheDocument()
    expect(screen.getByText('Unidade Centro')).toBeInTheDocument()
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

  it('has no icon box before the name', () => {
    const { container } = render(<SectorCard sector={sector} onOpen={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    const open = screen.getByRole('button', { name: 'Ver detalhes de Doca de Carga' })

    expect(open.querySelector('svg')).toBeNull()
    expect(open.children).toHaveLength(2)
    expect(container.querySelectorAll('svg')).toHaveLength(2)
  })

  it('keeps the delete and edit buttons as the only icon buttons', () => {
    setup()
    const del = screen.getByRole('button', { name: 'Excluir Doca de Carga' })
    const edit = screen.getByRole('button', { name: 'Editar Doca de Carga' })

    expect(del.querySelector('svg')).not.toBeNull()
    expect(edit.querySelector('svg')).not.toBeNull()
    expect(del.className).toMatch(/delete/)
    expect(edit.className).toMatch(/edit/)
  })

  it('calls onDelete from the trash without opening the details', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Doca de Carga' }))
    expect(h.onDelete).toHaveBeenCalledWith(sector)
    expect(h.onOpen).not.toHaveBeenCalled()
  })
})

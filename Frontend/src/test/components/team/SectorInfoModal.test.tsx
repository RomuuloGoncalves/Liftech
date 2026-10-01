import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SectorInfoModal from '../../../components/team/SectorInfoModal'

const sector = { id: '1', nome: 'Expedição B - Acesso 3', unidade: 'Unidade Votorantin' }

describe('SectorInfoModal', () => {
  it('shows nome and unidade in read-only fields', () => {
    render(<SectorInfoModal sector={sector} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Informações do setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome setor')).toHaveValue('Expedição B - Acesso 3')
    expect(screen.getByLabelText('Nome setor')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Unidade')).toHaveValue('Unidade Votorantin')
    expect(screen.getByLabelText('Unidade')).toHaveAttribute('readonly')
  })

  it('has no action buttons besides the close icon', () => {
    render(<SectorInfoModal sector={sector} onClose={vi.fn()} />)

    expect(screen.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Fechar'])
  })

  it('calls onClose from the close icon', () => {
    const onClose = vi.fn()
    render(<SectorInfoModal sector={sector} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

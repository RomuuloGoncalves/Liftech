import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SectorFormModal from '../../../components/team/SectorFormModal'

const sector = { id: '1', nome: 'Expedição B - Acesso 3', unidade: 'Unidade Votorantin' }

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('SectorFormModal', () => {
  it('opens titled "Cadastrar um novo setor" with empty fields and a "Criar setor" button', () => {
    render(<SectorFormModal onSave={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Cadastrar um novo setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome setor')).toHaveValue('')
    expect(screen.getByLabelText('Unidade')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Criar setor' })).toBeInTheDocument()
  })

  it('saves trimmed nome and unidade', () => {
    const onSave = vi.fn()
    render(<SectorFormModal onSave={onSave} onClose={vi.fn()} />)

    fill('Nome setor', '  Separação ')
    fill('Unidade', 'Unidade Norte')
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    expect(onSave).toHaveBeenCalledWith({ nome: 'Separação', unidade: 'Unidade Norte' })
  })

  it.each(['Nome setor', 'Unidade'])('blocks the save and flags %s when it is empty', (label) => {
    const onSave = vi.fn()
    render(<SectorFormModal onSave={onSave} onClose={vi.fn()} />)

    fill('Nome setor', 'Separação')
    fill('Unidade', 'Unidade Norte')
    fill(label, ' ')
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByLabelText(label)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('opens titled "Editar setor" with the sector values and a "Confirmar" button', () => {
    render(<SectorFormModal sector={sector} onSave={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Editar setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome setor')).toHaveValue('Expedição B - Acesso 3')
    expect(screen.getByLabelText('Unidade')).toHaveValue('Unidade Votorantin')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('closes without saving on Cancelar', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<SectorFormModal onSave={onSave} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })
})

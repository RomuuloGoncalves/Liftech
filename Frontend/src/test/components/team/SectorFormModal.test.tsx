import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SectorFormModal from '../../../components/team/SectorFormModal'

const sector = { _id: '1', nome: 'Expedição B - Acesso 3', filialId: 'f1', filial: { nome: 'Unidade Votorantin' } }
const branches = [
  { _id: 'f1', nome: 'Unidade Votorantin', matriz: true },
  { _id: 'f2', nome: 'Unidade Centro', matriz: false },
]
const oneBranch = [branches[1]]

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

const branchField = () => screen.getByLabelText('Filial')

describe('SectorFormModal', () => {
  it('opens titled "Cadastrar um novo setor" with an empty name and a "Criar setor" button', () => {
    render(<SectorFormModal branches={branches} canMove onSave={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Cadastrar um novo setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome setor')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Criar setor' })).toBeInTheDocument()
  })

  it('saves the trimmed nome and the picked branch', () => {
    const onSave = vi.fn()
    render(<SectorFormModal branches={branches} canMove onSave={onSave} onClose={vi.fn()} />)

    fill('Nome setor', '  Separação ')
    fill('Filial', 'f2')
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    expect(onSave).toHaveBeenCalledWith({ nome: 'Separação', filialId: 'f2' })
  })

  it('blocks the save and flags the name when it is empty', () => {
    const onSave = vi.fn()
    render(<SectorFormModal branches={branches} canMove onSave={onSave} onClose={vi.fn()} />)

    fill('Nome setor', ' ')
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Nome setor')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Campo obrigatório')).toBeInTheDocument()
  })

  it('company scope: shows a select with the scope branches, also when editing', () => {
    render(<SectorFormModal sector={sector} branches={branches} canMove onSave={vi.fn()} onClose={vi.fn()} />)

    expect(branchField().tagName).toBe('SELECT')
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Unidade Votorantin', 'Unidade Centro'])
    expect(branchField()).toHaveValue('f1')
  })

  it('company scope: moving a sector saves the new branch', () => {
    const onSave = vi.fn()
    render(<SectorFormModal sector={sector} branches={branches} canMove onSave={onSave} onClose={vi.fn()} />)

    fill('Filial', 'f2')
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onSave).toHaveBeenCalledWith({ nome: 'Expedição B - Acesso 3', filialId: 'f2' })
  })

  it('branches scope: editing shows the branch name read-only, with no select', () => {
    const onSave = vi.fn()
    render(<SectorFormModal sector={sector} branches={branches} canMove={false} onSave={onSave} onClose={vi.fn()} />)

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(branchField()).toHaveValue('Unidade Votorantin')
    expect(branchField()).toHaveAttribute('readonly')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onSave).toHaveBeenCalledWith({ nome: 'Expedição B - Acesso 3', filialId: 'f1' })
  })

  it('branches scope with 2+ branches: creating shows the select', () => {
    render(<SectorFormModal branches={branches} canMove={false} onSave={vi.fn()} onClose={vi.fn()} />)

    expect(branchField().tagName).toBe('SELECT')
  })

  it('branches scope with one branch: creating shows its name read-only and saves it', () => {
    const onSave = vi.fn()
    render(<SectorFormModal branches={oneBranch} canMove={false} onSave={onSave} onClose={vi.fn()} />)

    expect(screen.queryByRole('combobox')).toBeNull()
    expect(branchField()).toHaveValue('Unidade Centro')

    fill('Nome setor', 'Doca')
    fireEvent.click(screen.getByRole('button', { name: 'Criar setor' }))
    expect(onSave).toHaveBeenCalledWith({ nome: 'Doca', filialId: 'f2' })
  })

  it('creating defaults to defaultFilialId', () => {
    render(<SectorFormModal branches={branches} canMove defaultFilialId="f2" onSave={vi.fn()} onClose={vi.fn()} />)

    expect(branchField()).toHaveValue('f2')
  })

  it('opens titled "Editar setor" with the sector name and a "Confirmar" button', () => {
    render(<SectorFormModal sector={sector} branches={branches} canMove onSave={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog', { name: 'Editar setor' })).toBeInTheDocument()
    expect(screen.getByLabelText('Nome setor')).toHaveValue('Expedição B - Acesso 3')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeInTheDocument()
  })

  it('closes without saving on Cancelar', () => {
    const onSave = vi.fn()
    const onClose = vi.fn()
    render(<SectorFormModal branches={branches} canMove onSave={onSave} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSave).not.toHaveBeenCalled()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from '../../../components/common/ConfirmDialog'

describe('ConfirmDialog busy', () => {
  it('trava os botões e mostra o spinner enquanto ocupado', () => {
    render(<ConfirmDialog title="t" message="m" confirmLabel="Excluir" onConfirm={vi.fn()} onCancel={vi.fn()} busy />)
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Excluir' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('sem busy, os botões ficam ativos e sem spinner', () => {
    render(<ConfirmDialog title="t" message="m" confirmLabel="Excluir" onConfirm={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Excluir' })).toBeEnabled()
    expect(screen.queryByTestId('spinner')).toBeNull()
  })
})

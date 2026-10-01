import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ConfirmDialog from '../../../components/common/ConfirmDialog'

function setup() {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(
    <ConfirmDialog
      title="Excluir setor"
      message="Excluir Doca de Carga? Esta ação não pode ser desfeita."
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('shows the title and the message naming the item', () => {
    setup()

    expect(screen.getByRole('dialog', { name: 'Excluir setor' })).toBeInTheDocument()
    expect(screen.getByText('Excluir Doca de Carga? Esta ação não pode ser desfeita.')).toBeInTheDocument()
  })

  it('calls onConfirm only when Excluir is clicked', () => {
    const { onConfirm, onCancel } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(onCancel).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancelar is clicked', () => {
    const { onConfirm, onCancel } = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel on Escape and on backdrop click, never onConfirm', () => {
    const { onConfirm, onCancel } = setup()

    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(onCancel).toHaveBeenCalledTimes(2)
    expect(onConfirm).not.toHaveBeenCalled()
  })
})

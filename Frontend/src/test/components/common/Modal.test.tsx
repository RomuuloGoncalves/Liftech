import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Modal from '../../../components/common/Modal'

describe('Modal', () => {
  it('renders a labelled modal dialog with its title and children', () => {
    render(
      <Modal title="Meu modal" onClose={vi.fn()}>
        <p>conteúdo</p>
      </Modal>
    )

    const dialog = screen.getByRole('dialog', { name: 'Meu modal' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal title="Meu modal" onClose={onClose}>x</Modal>)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    render(<Modal title="Meu modal" onClose={onClose}>x</Modal>)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys', () => {
    const onClose = vi.fn()
    render(<Modal title="Meu modal" onClose={onClose}>x</Modal>)

    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose when the backdrop is clicked, but not when the dialog is', () => {
    const onClose = vi.fn()
    render(<Modal title="Meu modal" onClose={onClose}>x</Modal>)

    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stops listening for Escape after it unmounts', () => {
    const onClose = vi.fn()
    const { unmount } = render(<Modal title="Meu modal" onClose={onClose}>x</Modal>)

    unmount()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})

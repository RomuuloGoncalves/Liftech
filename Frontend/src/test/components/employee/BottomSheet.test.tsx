import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import BottomSheet from '../../../components/employee/BottomSheet'

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <BottomSheet open={false} title="Filtro" onClose={vi.fn()}>
        <p>conteúdo</p>
      </BottomSheet>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('renders a labelled modal dialog with title, content and footer', () => {
    render(
      <BottomSheet open title="Filtro" onClose={vi.fn()} footer={<button>Aplicar</button>}>
        <p>conteúdo</p>
      </BottomSheet>
    )
    const dialog = screen.getByRole('dialog', { name: 'Filtro' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aplicar' })).toBeInTheDocument()
  })

  it('renders through a portal on document.body', () => {
    const { container } = render(
      <BottomSheet open title="Filtro" onClose={vi.fn()}>
        x
      </BottomSheet>
    )
    expect(container).not.toContainElement(screen.getByRole('dialog'))
  })

  it('closes with Escape', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="Filtro" onClose={onClose}>
        x
      </BottomSheet>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when the backdrop is clicked but not when the sheet is', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="Filtro" onClose={onClose}>
        x
      </BottomSheet>
    )
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes with the cancel chevron button', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet open title="Filtro" onClose={onClose}>
        x
      </BottomSheet>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('moves focus into the sheet on open and returns it on close', () => {
    const Host = () => {
      const [open, setOpen] = useState(false)
      return (
        <>
          <button onClick={() => setOpen(true)}>abrir</button>
          <BottomSheet open={open} title="Filtro" onClose={() => setOpen(false)}>
            <input aria-label="campo" />
          </BottomSheet>
        </>
      )
    }
    render(<Host />)
    const trigger = screen.getByRole('button', { name: 'abrir' })
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('traps focus: Tab on the last element wraps to the first, Shift+Tab on the first wraps to the last', () => {
    render(
      <BottomSheet open title="Filtro" onClose={vi.fn()} footer={<button>Aplicar</button>}>
        <input aria-label="campo" />
      </BottomSheet>
    )
    const first = screen.getByRole('button', { name: 'Cancelar' })
    const last = screen.getByRole('button', { name: 'Aplicar' })

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })
})

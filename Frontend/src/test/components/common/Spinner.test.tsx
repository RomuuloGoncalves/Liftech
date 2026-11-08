import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Spinner, { SpinnerButton } from '../../../components/common/Spinner'

describe('Spinner component (UXP-06)', () => {
  it('renders a spinner with aria-label and role status when label is provided', () => {
    render(<Spinner ariaLabel="Carregando..." />)
    const spinner = screen.getByRole('status', { name: 'Carregando...' })
    expect(spinner).toBeInTheDocument()
  })

  it('renders with aria-hidden when no aria-label is passed', () => {
    const { container } = render(<Spinner />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('SpinnerButton component (UXP-03, UXP-06)', () => {
  it('renders normal button when not busy and triggers click', () => {
    const onClick = vi.fn()
    render(<SpinnerButton onClick={onClick}>Salvar</SpinnerButton>)

    const button = screen.getByRole('button', { name: 'Salvar' })
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
    expect(button).not.toHaveAttribute('aria-busy')

    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders busy state with spinner, busyText, disabled and aria-busy="true"', () => {
    const onClick = vi.fn()
    render(
      <SpinnerButton busy busyText="Salvando..." onClick={onClick}>
        Salvar
      </SpinnerButton>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveStyle({ cursor: 'not-allowed' })
    expect(screen.getByText('Salvando...')).toBeInTheDocument()
    expect(screen.queryByText('Salvar')).not.toBeInTheDocument()

    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

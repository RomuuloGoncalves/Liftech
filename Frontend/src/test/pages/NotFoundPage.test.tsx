import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import NotFoundPage from '../../pages/NotFoundPage'

describe('NotFoundPage component', () => {
  it('renders 404 heading and link to home', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404')
    expect(screen.getByText(/página não encontrada/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /voltar para o início/i })).toHaveAttribute('href', '/')
  })
})

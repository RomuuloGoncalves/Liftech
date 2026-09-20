import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import AppRoutes from '../../routes/appRoutes'

describe('Centralized AppRoutes', () => {
  it('renders 404 NotFoundPage for unmatched routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRoutes />
      </MemoryRouter>
    )
    expect(screen.getByText(/Página Não Encontrada/i)).toBeInTheDocument()
  })
})

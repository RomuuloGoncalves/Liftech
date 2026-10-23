import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import EmployeeHistoryPage from '../../../pages/employee/EmployeeHistoryPage'

vi.mock('../../../hooks/useEmployeeData', () => ({
  useEmployeeData: () => ({ machines: [], records: [], loading: true }),
}))

describe('EmployeeHistoryPage skeleton', () => {
  it('shows the filters block and the cards of the history while loading', () => {
    const { container } = render(
      <MemoryRouter>
        <EmployeeHistoryPage />
      </MemoryRouter>
    )
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(container.querySelector('[data-skeleton-filters]')!.children).toHaveLength(3)
    expect(container.querySelectorAll('[data-skeleton-card]')).toHaveLength(6)
  })
})

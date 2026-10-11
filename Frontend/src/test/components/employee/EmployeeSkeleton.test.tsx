import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EmployeeSkeleton from '../../../components/employee/EmployeeSkeleton'

const count = (container: HTMLElement, attr: string) => container.querySelectorAll(`[${attr}]`).length

describe('EmployeeSkeleton', () => {
  it.each(['home', 'list', 'session', 'form', 'title'] as const)(
    '%s announces loading once and marks the region busy',
    (variant) => {
      const { container } = render(<EmployeeSkeleton variant={variant} />)
      expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
      expect(screen.getByRole('status').closest('[aria-busy="true"]')).not.toBeNull()
      expect(container.querySelector('[aria-hidden="true"]')).not.toBeNull()
    }
  )

  it('home has 3 cards and 2 side-by-side boxes', () => {
    const { container } = render(<EmployeeSkeleton variant="home" />)
    expect(count(container, 'data-skeleton-card')).toBe(3)
    expect(count(container, 'data-skeleton-box')).toBe(2)
  })

  it('list has 6 cards by default and honors count', () => {
    const { container, unmount } = render(<EmployeeSkeleton variant="list" />)
    expect(count(container, 'data-skeleton-card')).toBe(6)
    unmount()
    const other = render(<EmployeeSkeleton variant="list" count={2} />)
    expect(count(other.container, 'data-skeleton-card')).toBe(2)
  })

  it('session has 2 buttons and no cards', () => {
    const { container } = render(<EmployeeSkeleton variant="session" />)
    expect(count(container, 'data-skeleton-button')).toBe(2)
    expect(count(container, 'data-skeleton-card')).toBe(0)
  })

  it('form has 4 fields and 2 buttons, or only the fields without buttons', () => {
    const { container, unmount } = render(<EmployeeSkeleton variant="form" />)
    expect(count(container, 'data-skeleton-field')).toBe(4)
    expect(count(container, 'data-skeleton-button')).toBe(2)
    unmount()
    const other = render(<EmployeeSkeleton variant="form" buttons={false} />)
    expect(count(other.container, 'data-skeleton-field')).toBe(4)
    expect(count(other.container, 'data-skeleton-button')).toBe(0)
  })

  it('title has a single line and no cards, fields or buttons', () => {
    const { container } = render(<EmployeeSkeleton variant="title" />)
    expect(count(container, 'data-skeleton-card') + count(container, 'data-skeleton-field')).toBe(0)
    expect(container.querySelector('[aria-hidden="true"]')!.children).toHaveLength(1)
  })
})

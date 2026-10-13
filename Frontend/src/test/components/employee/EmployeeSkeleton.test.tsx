import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EmployeeSkeleton from '../../../components/employee/EmployeeSkeleton'

const count = (container: HTMLElement, attr: string) => container.querySelectorAll(`[${attr}]`).length

describe('EmployeeSkeleton', () => {
  it.each(['home', 'list', 'history', 'session', 'form', 'title', 'settings'] as const)(
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

  it('settings has the data card with 3 fields, the 2 buttons and the 2 text blocks of the notice and feedback', () => {
    const { container } = render(<EmployeeSkeleton variant="settings" />)
    expect(count(container, 'data-skeleton-card')).toBe(1)
    expect(container.querySelector('[data-skeleton-card]')!.querySelectorAll('[data-skeleton-field]')).toHaveLength(3)
    expect(count(container, 'data-skeleton-button')).toBe(2)
    expect(count(container, 'data-skeleton-notice')).toBe(1)
    expect(count(container, 'data-skeleton-textarea')).toBe(1)
  })

  it('title has a single line and no cards, fields or buttons', () => {
    const { container } = render(<EmployeeSkeleton variant="title" />)
    expect(count(container, 'data-skeleton-card') + count(container, 'data-skeleton-field')).toBe(0)
    expect(container.querySelector('[aria-hidden="true"]')!.children).toHaveLength(1)
  })

  it('home shows the last machine card between the banner and the two boxes', () => {
    const { container } = render(<EmployeeSkeleton variant="home" />)
    const last = container.querySelector('[data-skeleton-last]')!
    const box = container.querySelector('[data-skeleton-box]')!
    const firstCard = container.querySelector('[data-skeleton-card]')!
    expect(last.children.length).toBeGreaterThanOrEqual(2)
    expect(last.compareDocumentPosition(box) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(box.compareDocumentPosition(firstCard) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('home cards mirror MachineListCard without date and time: top, divider and a bottom with one field and the action', () => {
    const { container } = render(<EmployeeSkeleton variant="home" />)
    for (const card of container.querySelectorAll('[data-skeleton-card]')) {
      expect(card.querySelector('[data-skeleton-part="top"]')!.children).toHaveLength(2)
      expect(card.querySelectorAll('[data-skeleton-part="divider"]')).toHaveLength(1)
      const bottom = card.querySelector('[data-skeleton-part="bottom"]')!
      expect(bottom.querySelectorAll('[data-skeleton-part="field"]')).toHaveLength(1)
      expect(bottom.querySelectorAll('[data-skeleton-part="action"]')).toHaveLength(1)
    }
  })

  it('shows the screen title and a two-line subtitle in the home and list headers', () => {
    for (const variant of ['home', 'list'] as const) {
      const { container, unmount } = render(<EmployeeSkeleton variant={variant} />)
      expect(container.querySelectorAll('[data-skeleton-part="title"]')).toHaveLength(1)
      expect(container.querySelector('[data-skeleton-part="subtitle"]')!.children).toHaveLength(2)
      unmount()
    }
  })

  it('list cards carry date and time: the bottom has the sector field and a date-time field with two values', () => {
    const { container } = render(<EmployeeSkeleton variant="list" count={2} />)
    for (const card of container.querySelectorAll('[data-skeleton-card]')) {
      const fields = card.querySelectorAll('[data-skeleton-part="bottom"] [data-skeleton-part="field"]')
      expect(fields).toHaveLength(2)
      expect(fields[0].querySelectorAll('[data-skeleton-part="value"]')).toHaveLength(1)
      expect(fields[1].querySelectorAll('[data-skeleton-part="value"]')).toHaveLength(2)
    }
  })

  it('history shows title, subtitle, the "Filtros" title and 3 filter rows (period, two times, search) above 6 cards', () => {
    const { container } = render(<EmployeeSkeleton variant="history" />)
    expect(container.querySelectorAll('[data-skeleton-part="title"]')).toHaveLength(1)
    expect(container.querySelector('[data-skeleton-part="subtitle"]')!.children).toHaveLength(2)
    expect(container.querySelectorAll('[data-skeleton-part="filters-title"]')).toHaveLength(1)
    const rows = container.querySelector('[data-skeleton-filters]')!.children
    expect([...rows].map((row) => (row.hasAttribute('data-skeleton-field') ? 1 : row.querySelectorAll('[data-skeleton-field]').length))).toEqual([1, 2, 1])
    expect(count(container, 'data-skeleton-card')).toBe(6)
    expect(
      container.querySelector('[data-skeleton-filters]')!.compareDocumentPosition(container.querySelector('[data-skeleton-card]')!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('session shows the description as a single bar and no filter bar', () => {
    const { container } = render(<EmployeeSkeleton variant="session" />)
    expect(count(container, 'data-skeleton-part="description"')).toBe(1)
    expect(count(container, 'data-skeleton-filters')).toBe(0)
    expect(count(container, 'data-skeleton-field')).toBe(0)
  })
})

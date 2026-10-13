import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PageSkeleton from '../../../components/common/PageSkeleton'

const cards = (container: HTMLElement) => container.querySelectorAll('[data-skeleton-card]')

describe('PageSkeleton', () => {
  it('announces loading once and marks the region busy', () => {
    render(<PageSkeleton variant="grid" />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(screen.getByRole('status').closest('[aria-busy="true"]')).not.toBeNull()
  })

  it('renders 8 cards in the grid variant by default and honors count', () => {
    const { container, unmount } = render(<PageSkeleton variant="grid" />)
    expect(cards(container)).toHaveLength(8)
    unmount()
    const other = render(<PageSkeleton variant="grid" count={3} />)
    expect(cards(other.container)).toHaveLength(3)
  })

  it('applies the page grid class so the layout does not jump', () => {
    const { container } = render(<PageSkeleton variant="grid" gridClassName="page-grid" />)
    expect(container.querySelector('.page-grid')).not.toBeNull()
    expect(container.querySelector('.page-grid')!.querySelectorAll('[data-skeleton-card]')).toHaveLength(8)
  })

  it('renders 4 category panels of 4 fleet cards in the kanban variant (accidents, active, maintenance, available)', () => {
    const { container } = render(<PageSkeleton variant="kanban" />)
    expect(container.querySelectorAll('[data-skeleton-row]')).toHaveLength(4)
    expect(cards(container)).toHaveLength(16)
    expect(container.querySelectorAll('[data-skeleton-row] [data-skeleton-part="strip"]')).toHaveLength(16)
  })

  it('kanban panels have a header with a label and tools; only the first has the period', () => {
    const { container } = render(<PageSkeleton variant="kanban" />)
    const rows = [...container.querySelectorAll('[data-skeleton-row]')]
    for (const row of rows) {
      const header = row.querySelector('[data-skeleton-part="header"]')!
      expect(header.querySelector('[data-skeleton-part="label"]')).not.toBeNull()
      expect(header.querySelector('[data-skeleton-part="tools"]')!.children.length).toBeGreaterThan(0)
    }
    expect(rows.map((row) => row.querySelectorAll('[data-skeleton-part="period"]').length)).toEqual([1, 0, 0, 0])
  })

  it('renders the page toolbar placeholder before the kanban panels', () => {
    const { container } = render(
      <PageSkeleton variant="kanban">
        <div data-testid="bar" />
      </PageSkeleton>
    )
    expect(
      screen.getByTestId('bar').compareDocumentPosition(container.querySelector('[data-skeleton-row]')!) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('renders 8 employee and 4 sector cards in the team variant', () => {
    const { container } = render(<PageSkeleton variant="team" />)
    const sections = container.querySelectorAll('[data-skeleton-row]')
    expect(sections).toHaveLength(2)
    expect(sections[0].querySelectorAll('[data-skeleton-card]')).toHaveLength(8)
    expect(sections[1].querySelectorAll('[data-skeleton-card]')).toHaveLength(4)
  })

  it('hides the placeholder blocks from assistive technology', () => {
    const { container } = render(<PageSkeleton variant="kanban" />)
    const blocks = container.querySelector('[aria-hidden="true"]')
    expect(blocks).not.toBeNull()
    expect(blocks!.querySelectorAll('[data-skeleton-card]')).toHaveLength(16)
  })

  it('renders the page toolbar placeholder before the grid', () => {
    const { container } = render(
      <PageSkeleton variant="grid" gridClassName="page-grid">
        <div data-testid="bar" />
      </PageSkeleton>
    )
    const bar = screen.getByTestId('bar')
    const grid = container.querySelector('.page-grid')!
    expect(bar.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(bar.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('machine card mirrors MachineCard: name and id, 2 detail lines, footer with badge and session time', () => {
    const { container } = render(<PageSkeleton variant="grid" count={1} />)
    const card = cards(container)[0]
    expect(card.querySelector('[data-skeleton-part="top"]')!.children).toHaveLength(2)
    expect(card.querySelector('[data-skeleton-part="details"]')!.children).toHaveLength(2)
    expect(card.querySelector('[data-skeleton-part="footer"]')!.children).toHaveLength(2)
  })

  it('fleet card mirrors FleetCard: top strip and 3 detail groups, in the grid variant', () => {
    const { container } = render(<PageSkeleton variant="grid" card="fleet" count={2} gridClassName="page-grid" />)
    const list = container.querySelector('.page-grid')!.querySelectorAll('[data-skeleton-card]')
    expect(list).toHaveLength(2)
    expect(list[0].querySelectorAll('[data-skeleton-part="strip"]')).toHaveLength(1)
    expect(list[0].querySelector('[data-skeleton-part="details"]')!.children).toHaveLength(3)
    expect(list[0].querySelector('[data-skeleton-part="footer"]')).toBeNull()
  })
})

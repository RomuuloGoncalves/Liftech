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

  it('renders 3 rows of 4 cards in the kanban variant', () => {
    const { container } = render(<PageSkeleton variant="kanban" />)
    expect(container.querySelectorAll('[data-skeleton-row]')).toHaveLength(3)
    expect(cards(container)).toHaveLength(12)
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
    expect(blocks!.querySelectorAll('[data-skeleton-card]')).toHaveLength(12)
  })
})

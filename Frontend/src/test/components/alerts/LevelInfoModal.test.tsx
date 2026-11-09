import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import LevelInfoModal from '../../../components/alerts/LevelInfoModal'

const block = (css: string, selector: string) =>
  [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].find((m) => m[1].trim() === selector)?.[2] ?? ''

describe('LevelInfoModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a labelled dialog with title "Informações sobre nível crítico" (EXP-01)', () => {
    render(<LevelInfoModal onClose={vi.fn()} />)
    const dialog = screen.getByRole('dialog', { name: 'Informações sobre nível crítico' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('lists card headers in order Crítico, Alta, Média (EXP-02)', () => {
    render(<LevelInfoModal onClose={vi.fn()} />)
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Crítico', 'Alta', 'Média'])
  })

  it('displays the mapped causes in strong tag for each level card (EXP-03, TLQ-04)', () => {
    render(<LevelInfoModal onClose={vi.fn()} />)
    const cards = screen.getAllByRole('listitem')
    expect(cards).toHaveLength(3)

    const causesByCard = cards.map((card) =>
      Array.from(card.querySelectorAll('strong')).map((el) => el.textContent)
    )
    expect(causesByCard).toEqual([
      ['inclinação excessiva'],
      ['colisão'],
      ['frenagem brusca', 'aceleração brusca', 'curva brusca'],
    ])
  })

  it('defines --tone in .critical, .high, .medium and uses var(--tone) on card border and level title (EXP-04)', () => {
    const cssPath = resolve(process.cwd(), 'src/components/alerts/LevelInfoModal.module.css')
    const css = readFileSync(cssPath, 'utf8')

    expect(block(css, '.critical')).toMatch(/--tone:\s*var\(--urgency-critical\)/)
    expect(block(css, '.high')).toMatch(/--tone:\s*var\(--urgency-high\)/)
    expect(block(css, '.medium')).toMatch(/--tone:\s*var\(--urgency-medium\)/)

    expect(block(css, '.card')).toMatch(/border-left:\s*20px\s+solid\s+var\(--tone\)/)
    expect(block(css, '.level')).toMatch(/color:\s*var\(--tone\)/)
  })

  it('omits level without cause in ACCIDENT_URGENCY and renders all mapped causes (EXP-05)', async () => {
    vi.resetModules()
    vi.doMock('../../../data/machines', async () => {
      const actual = await vi.importActual<typeof import('../../../data/machines')>('../../../data/machines')
      return {
        ...actual,
        ACCIDENT_URGENCY: {
          frenagem_brusca: 'media',
          aceleracao_brusca: 'media',
          inclinacao_excessiva: 'critica',
        },
      }
    })

    const { default: DynamicLevelInfoModal } = await import('../../../components/alerts/LevelInfoModal')
    render(<DynamicLevelInfoModal onClose={vi.fn()} />)

    expect(screen.queryByRole('heading', { level: 3, name: 'Alta' })).not.toBeInTheDocument()

    const mediaHeading = screen.getByRole('heading', { level: 3, name: 'Média' })
    expect(mediaHeading).toBeInTheDocument()
    const mediaCard = mediaHeading.closest('li')
    const mediaCauses = Array.from(mediaCard?.querySelectorAll('strong') ?? []).map((el) => el.textContent)
    expect(mediaCauses).toEqual(['frenagem brusca', 'aceleração brusca'])

    const criticoHeading = screen.getByRole('heading', { level: 3, name: 'Crítico' })
    expect(criticoHeading).toBeInTheDocument()
  })

  it('calls onClose when close button, backdrop or Escape is triggered (EXP-06)', () => {
    const onClose = vi.fn()
    const { unmount } = render(<LevelInfoModal onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onClose).toHaveBeenCalledTimes(1)

    onClose.mockClear()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    onClose.mockClear()
    const dialog = screen.getByRole('dialog')
    fireEvent.click(dialog.parentElement as HTMLElement)
    expect(onClose).toHaveBeenCalledTimes(1)

    unmount()
  })
})

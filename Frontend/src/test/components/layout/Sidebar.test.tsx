import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Sidebar from '../../../components/layout/Sidebar'
import styles from '../../../components/layout/Sidebar.module.css'

const STORAGE_KEY = 'liftech.sidebar.collapsed'
const DESKTOP_WIDTH = 1280
const MOBILE_WIDTH = 500

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  fireEvent(window, new Event('resize'))
}

function renderSidebarAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Sidebar />
      <Routes>
        <Route path="/" element={<div>Página Visão Geral</div>} />
        <Route path="/frota" element={<div>Página Frota</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('Sidebar component', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setViewportWidth(DESKTOP_WIDTH)
  })

  afterEach(() => {
    setViewportWidth(DESKTOP_WIDTH)
  })

  it('renders the Liftech brand name', () => {
    renderSidebarAt('/')
    expect(screen.getByAltText('Liftech')).toBeInTheDocument()
  })

  it('renders exactly 4 navigation links, in order, each with an icon', () => {
    renderSidebarAt('/')
    const list = screen.getByRole('list')
    const links = within(list).getAllByRole('link')
    expect(links).toHaveLength(4)
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Visão Geral',
      'Gerenciamento Frota',
      'Gestão de Equipe',
      'Histórico de Alertas',
    ])
    links.forEach((link) => {
      expect(link.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('highlights the link matching the current route with the active class and aria-current', () => {
    renderSidebarAt('/frota')
    const activeLink = screen.getByRole('link', { name: /gerenciamento frota/i })
    expect(activeLink).toHaveAttribute('aria-current', 'page')
    expect(activeLink.className).toContain(styles.active)

    const inactiveLink = screen.getByRole('link', { name: /visão geral/i })
    expect(inactiveLink).not.toHaveAttribute('aria-current')
    expect(inactiveLink.className).not.toContain(styles.active)
  })

  it('navigates to the target route when a link is clicked', () => {
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('link', { name: /gerenciamento frota/i }))
    expect(screen.getByText('Página Frota')).toBeInTheDocument()
  })

  it('renders the footer with Feedback & Sugestões and Políticas & Privacidades', () => {
    renderSidebarAt('/')
    expect(screen.getByRole('button', { name: /feedback & sugestões/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /políticas & privacidades/i })).toBeInTheDocument()
  })

  it('toggles between expanded and collapsed layouts when the toggle button is clicked', () => {
    renderSidebarAt('/')
    expect(screen.getByAltText('Liftech')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))
    expect(screen.queryByAltText('Liftech')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /expandir menu/i }))
    expect(screen.getByAltText('Liftech')).toBeInTheDocument()
  })

  it('persists the collapsed state to localStorage under liftech.sidebar.collapsed', () => {
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true')

    fireEvent.click(screen.getByRole('button', { name: /expandir menu/i }))
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false')
  })

  it('initializes collapsed state from localStorage, defaulting to expanded when absent', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true')
    renderSidebarAt('/')
    expect(screen.queryByAltText('Liftech')).not.toBeInTheDocument()
  })

  it('defaults to expanded when localStorage has no stored value', () => {
    renderSidebarAt('/')
    expect(screen.getByAltText('Liftech')).toBeInTheDocument()
  })

  it('keeps the active link highlighted, icon-only, while collapsed', () => {
    const { container } = renderSidebarAt('/frota')
    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))

    const activeLink = container.querySelector(`a.${CSS.escape(styles.active)}`)
    expect(activeLink).toHaveAttribute('href', '/frota')
    expect(screen.queryByText('Gerenciamento Frota')).not.toBeInTheDocument()
  })

  it('renders as a closed overlay drawer below 768px, showing a hamburger trigger', () => {
    setViewportWidth(MOBILE_WIDTH)
    renderSidebarAt('/')
    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /fechar menu/i })).not.toBeInTheDocument()
  })

  it('opens the drawer with a backdrop when the hamburger button is clicked on mobile', () => {
    setViewportWidth(MOBILE_WIDTH)
    const { container } = renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }))

    expect(screen.getByRole('button', { name: /fechar menu/i })).toBeInTheDocument()
    expect(container.querySelector(`.${CSS.escape(styles.backdrop)}`)).toBeTruthy()
  })

  it('closes the drawer when the backdrop is clicked', () => {
    setViewportWidth(MOBILE_WIDTH)
    const { container } = renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }))

    const backdrop = container.querySelector(`.${CSS.escape(styles.backdrop)}`) as HTMLElement
    fireEvent.click(backdrop)

    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument()
  })

  it('closes the drawer when Escape is pressed', () => {
    setViewportWidth(MOBILE_WIDTH)
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }))

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument()
  })

  it('closes the drawer when a navigation link is clicked', () => {
    setViewportWidth(MOBILE_WIDTH)
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }))

    fireEvent.click(screen.getByRole('link', { name: /gerenciamento frota/i }))

    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument()
  })

  it('always renders the expanded layout while the mobile drawer is open, ignoring collapsed state', () => {
    window.localStorage.setItem(STORAGE_KEY, 'true')
    setViewportWidth(MOBILE_WIDTH)
    renderSidebarAt('/')

    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }))

    expect(screen.getByAltText('Liftech')).toBeInTheDocument()
    expect(screen.getByText('Gerenciamento Frota')).toBeInTheDocument()
  })

  it('falls back to in-memory expanded state without throwing when localStorage is unavailable', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(() => renderSidebarAt('/')).not.toThrow()
    expect(screen.getByAltText('Liftech')).toBeInTheDocument()
    expect(() => fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))).not.toThrow()

    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
  })

  it('marks no link active when the current route matches none of the 4 paths', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <Sidebar />
      </MemoryRouter>
    )
    const list = screen.getByRole('list')
    within(list)
      .getAllByRole('link')
      .forEach((link) => expect(link).not.toHaveAttribute('aria-current'))
  })

  it('closes the drawer and returns to desktop layout when resized across the 768px breakpoint', () => {
    setViewportWidth(MOBILE_WIDTH)
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }))
    expect(screen.getByRole('button', { name: /fechar menu/i })).toBeInTheDocument()

    setViewportWidth(DESKTOP_WIDTH)

    expect(screen.queryByRole('button', { name: /abrir menu/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /fechar menu/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /colapsar menu/i })).toBeInTheDocument()
  })
})

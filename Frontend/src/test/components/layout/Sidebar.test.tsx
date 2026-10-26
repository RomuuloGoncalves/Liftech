import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Sidebar from '../../../components/layout/Sidebar'
import { ActiveBranchProvider } from '../../../context/ActiveBranchContext'
import { AlertsProvider } from '../../../context/AlertsContext'
import { incidentService } from '../../../services/incidentService'
import '../../../components/alerts/AlertModal'
import styles from '../../../components/layout/Sidebar.module.css'

vi.mock('../../../services/incidentService', () => ({
  incidentService: {
    listar: vi.fn().mockResolvedValue([]),
    reportar: vi.fn(),
  },
}))

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
        <Route path="/dashboard" element={<div>Página Dashboard</div>} />
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

  it('shows the temporary Área do Funcionário link pointing to /funcionario', () => {
    renderSidebarAt('/')
    expect(screen.getByRole('link', { name: 'Área do Funcionário' })).toHaveAttribute('href', '/funcionario')
  })

  it('renders the Liftech brand name', () => {
    renderSidebarAt('/')
    expect(screen.getByAltText('Liftech')).toBeInTheDocument()
  })

  it('renders exactly 5 navigation links, in order, each with an icon', () => {
    renderSidebarAt('/')
    const list = screen.getByRole('list')
    const links = within(list).getAllByRole('link')
    expect(links).toHaveLength(5)
    expect(links.map((link) => link.textContent?.trim())).toEqual([
      'Dashboard',
      'Visão Geral',
      'Gerenciamento Frota',
      'Gestão de Equipe',
      'Histórico de Alertas',
    ])
    links.forEach((link) => {
      expect(link.querySelector('svg')).toBeInTheDocument()
    })
  })

  it('highlights only Dashboard with aria-current="page" on /dashboard, pointing to /dashboard', () => {
    renderSidebarAt('/dashboard')
    const dashLink = screen.getByRole('link', { name: 'Dashboard' })
    expect(dashLink).toHaveAttribute('aria-current', 'page')
    expect(dashLink).toHaveAttribute('href', '/dashboard')
    expect(dashLink.className).toContain(styles.active)

    const otherLinks = [
      screen.getByRole('link', { name: /visão geral/i }),
      screen.getByRole('link', { name: /gerenciamento frota/i }),
      screen.getByRole('link', { name: /gestão de equipe/i }),
      screen.getByRole('link', { name: /histórico de alertas/i }),
    ]
    otherLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current')
      expect(link.className).not.toContain(styles.active)
    })
  })

  it('highlights only Visão Geral with aria-current="page" on /', () => {
    renderSidebarAt('/')
    const vgLink = screen.getByRole('link', { name: /visão geral/i })
    expect(vgLink).toHaveAttribute('aria-current', 'page')
    expect(vgLink.className).toContain(styles.active)

    const otherLinks = [
      screen.getByRole('link', { name: 'Dashboard' }),
      screen.getByRole('link', { name: /gerenciamento frota/i }),
      screen.getByRole('link', { name: /gestão de equipe/i }),
      screen.getByRole('link', { name: /histórico de alertas/i }),
    ]
    otherLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current')
      expect(link.className).not.toContain(styles.active)
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

  it('keeps the feedback button, icon-only with an accessible name, while collapsed', () => {
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))

    const feedback = screen.getByRole('button', { name: 'Feedback & Sugestões' })
    expect(feedback).not.toHaveTextContent('Feedback & Sugestões')
    expect(feedback.querySelectorAll('svg')).toHaveLength(1)
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

describe('Sidebar branch selector and company', () => {
  const user = {
    _id: 'u1',
    nome: 'Ana',
    role: 'admin',
    empresa: { _id: 'e1', nome: 'Acme Logística' },
    escopo: 'empresa',
    filiais: [
      { _id: 'f1', nome: 'Filial 01', matriz: true },
      { _id: 'f2', nome: 'Filial 02', matriz: false },
    ],
  }

  const renderWithSession = () =>
    render(
      <MemoryRouter initialEntries={['/']}>
        <ActiveBranchProvider>
          <Sidebar />
        </ActiveBranchProvider>
      </MemoryRouter>
    )

  beforeEach(() => {
    window.localStorage.clear()
    setViewportWidth(DESKTOP_WIDTH)
  })

  it('shows the branch selector between the logo and the pages list when there is a session', () => {
    window.localStorage.setItem('user', JSON.stringify(user))
    renderWithSession()

    const selector = screen.getByRole('button', { name: /Filiais/ })
    expect(selector).toHaveTextContent('Todas as filiais')
    const logo = screen.getByAltText('Liftech')
    const pages = screen.getByText('Páginas')
    expect(logo.compareDocumentPosition(selector) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(selector.compareDocumentPosition(pages) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows neither the selector nor the company row without a session', () => {
    renderWithSession()

    expect(screen.queryByRole('button', { name: /Filiais/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Acme Logística')).not.toBeInTheDocument()
  })

  it('shows a user icon and the company name in the footer', () => {
    window.localStorage.setItem('user', JSON.stringify(user))
    renderWithSession()

    const company = screen.getByText('Acme Logística')
    expect(company.parentElement?.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /feedback & sugestões/i }).parentElement).toContainElement(company)
  })

  it('shows only the icon, named by aria-label and title, when collapsed', () => {
    window.localStorage.setItem('user', JSON.stringify(user))
    renderWithSession()

    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))

    expect(screen.queryByText('Acme Logística')).not.toBeInTheDocument()
    const company = screen.getByRole('img', { name: 'Acme Logística' })
    expect(company).toHaveAttribute('aria-label', 'Acme Logística')
    expect(company).toHaveAttribute('title', 'Acme Logística')
    expect(company.querySelector('svg')).toBeInTheDocument()
  })

  it('collapses the selector to the branch initial when the sidebar is collapsed', () => {
    window.localStorage.setItem('user', JSON.stringify(user))
    renderWithSession()

    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))

    expect(screen.getByRole('button', { name: 'Todas as filiais' })).toHaveTextContent(/^T$/)
  })

  it('keeps a single list on the page, the navigation one', () => {
    window.localStorage.setItem('user', JSON.stringify(user))
    renderWithSession()
    fireEvent.click(screen.getByRole('button', { name: /Filiais/ }))

    expect(screen.getAllByRole('list')).toHaveLength(1)
  })

  it('clicar no botão Feedback & Sugestões abre o diálogo Envie-nos feedback ou uma sugestão', async () => {
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /feedback & sugestões/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Envie-nos feedback ou uma sugestão' })
    expect(dialog).toBeInTheDocument()
  })

  it('com a sidebar recolhida, o botão só-ícone também abre o modal', async () => {
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))

    fireEvent.click(screen.getByRole('button', { name: /feedback & sugestões/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Envie-nos feedback ou uma sugestão' })
    expect(dialog).toBeInTheDocument()
  })

  it('fechar pelo X remove o diálogo', async () => {
    renderSidebarAt('/')
    fireEvent.click(screen.getByRole('button', { name: /feedback & sugestões/i }))

    const dialog = await screen.findByRole('dialog', { name: 'Envie-nos feedback ou uma sugestão' })
    expect(dialog).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog', { name: 'Envie-nos feedback ou uma sugestão' })).not.toBeInTheDocument()
  })

  it('clicar em "Simular alerta" mostra o alertdialog com Alexandre Mattos e não chama listar a mais', async () => {
    window.localStorage.setItem('user', JSON.stringify(user))
    const listarMock = vi.mocked(incidentService.listar)
    listarMock.mockClear()
    render(
      <MemoryRouter initialEntries={['/']}>
        <ActiveBranchProvider>
          <AlertsProvider>
            <Sidebar />
          </AlertsProvider>
        </ActiveBranchProvider>
      </MemoryRouter>
    )

    const chamadasAntes = listarMock.mock.calls.length
    const botaoSimular = screen.getByRole('button', { name: 'Simular alerta' })
    fireEvent.click(botaoSimular)

    const modal = await screen.findByRole('alertdialog')
    expect(modal).toHaveTextContent('Alexandre Mattos')
    expect(listarMock.mock.calls.length).toBe(chamadasAntes)
  })

  it('com a sidebar colapsada o botão "Simular alerta" não aparece', () => {
    window.localStorage.setItem('user', JSON.stringify(user))
    renderWithSession()

    expect(screen.getByRole('button', { name: 'Simular alerta' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /colapsar menu/i }))

    expect(screen.queryByRole('button', { name: 'Simular alerta' })).not.toBeInTheDocument()
  })
})

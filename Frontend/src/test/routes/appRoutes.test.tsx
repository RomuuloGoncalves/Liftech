import React, { Suspense } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import AppRoutes, { RouteErrorBoundary } from '../../routes/appRoutes'
import { ToastProvider } from '../../components/common/Toast'

vi.mock('../../services/accessRequestService', () => ({
  accessRequestService: {
    listar: vi.fn().mockResolvedValue([]),
    aprovar: vi.fn(),
    recusar: vi.fn(),
  },
}))

vi.mock('../../services/machineService', () => ({
  machineService: {
    listar: vi.fn().mockResolvedValue([]),
    criar: vi.fn(),
  },
}))

vi.mock('../../services/operatorService', () => ({
  operatorService: {
    listar: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../services/sessionService', () => ({
  sessionService: {
    listar: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('../../services/sectorService', () => ({
  sectorService: {
    listar: vi.fn().mockResolvedValue([]),
    listarSetores: vi.fn().mockResolvedValue([]),
  },
}))

describe('Centralized AppRoutes', () => {
  it('renders 404 NotFoundPage for unmatched routes', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRoutes />
      </MemoryRouter>
    )
    expect(await screen.findByText(/Página Não Encontrada/i)).toBeInTheDocument()
  })

  it('renders SolicitacoesPage on /solicitacoes with Pendentes tab, not 404', async () => {
    render(
      <MemoryRouter initialEntries={['/solicitacoes']}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </MemoryRouter>
    )
    const pendingTab = await screen.findByRole('tab', { name: /Pendentes/i })
    expect(pendingTab).toBeInTheDocument()
    expect(pendingTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.queryByText(/Página Não Encontrada/i)).not.toBeInTheDocument()
  })

  it('renders DashboardPage on /dashboard, not 404', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </MemoryRouter>
    )
    expect(await screen.findByText('Listagem de máquinas')).toBeInTheDocument()
    expect(screen.queryByText(/Página Não Encontrada/i)).not.toBeInTheDocument()
  })

  it('renders error boundary with Recarregar button when import() is rejected', async () => {
    const originalConsoleError = console.error
    console.error = vi.fn()

    const FailingLazyComponent = React.lazy(() => Promise.reject(new Error('Failed to load chunk')))

    const reloadMock = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    })

    render(
      <RouteErrorBoundary>
        <Suspense fallback={<div>Carregando...</div>}>
          <FailingLazyComponent />
        </Suspense>
      </RouteErrorBoundary>
    )

    const reloadButton = await screen.findByRole('button', { name: /Recarregar/i })
    expect(reloadButton).toBeInTheDocument()
    expect(screen.getByText(/Ocorreu um erro ao carregar a página/i)).toBeInTheDocument()

    fireEvent.click(reloadButton)
    expect(reloadMock).toHaveBeenCalledTimes(1)

    console.error = originalConsoleError
  })
})

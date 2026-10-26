import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SplashGate, {
  SEEN_KEY,
  SPLASH_MS,
  shouldShowSplash,
} from '../../../components/common/SplashGate'

const renderSplashGate = (path = '/login', durationMs = 1500) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SplashGate durationMs={durationMs}>
        <p>conteúdo</p>
      </SplashGate>
    </MemoryRouter>
  )

describe('SplashGate (SPL-01..07)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('SPL-01: em /login com durationMs=1500 mostra splash por 1500 ms e depois o conteúdo', () => {
    renderSplashGate('/login', 1500)

    // Splash visível e conteúdo ausente
    expect(screen.getByRole('img', { name: 'Liftech' })).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()

    // Em 1499 ms ainda é splash
    act(() => {
      vi.advanceTimersByTime(1499)
    })
    expect(screen.getByRole('img', { name: 'Liftech' })).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()

    // Após 1500 ms o conteúdo aparece e a splash some
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it("SPL-02: com sessionStorage['liftech.splashSeen']='1', conteúdo aparece direto, sem splash", () => {
    sessionStorage.setItem(SEEN_KEY, '1')

    renderSplashGate('/login', 1500)

    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('SPL-03: com prefers-reduced-motion: reduce, sem splash e sem marca gravada', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
    )

    renderSplashGate('/login', 1500)

    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(sessionStorage.getItem(SEEN_KEY)).toBeNull()
  })

  it('SPL-04: em /funcionario e /funcionario/maquinas, sem splash e sem marca gravada', () => {
    const { unmount } = renderSplashGate('/funcionario', 1500)
    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(sessionStorage.getItem(SEEN_KEY)).toBeNull()
    unmount()

    renderSplashGate('/funcionario/maquinas', 1500)
    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
    expect(sessionStorage.getItem(SEEN_KEY)).toBeNull()
  })

  it('SPL-05: enquanto visível, getByRole("img", { name: "Liftech" }) existe e o filho não está no DOM', () => {
    renderSplashGate('/frota', 1500)

    const splashImg = screen.getByRole('img', { name: 'Liftech' })
    expect(splashImg).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()
  })

  it('SPL-06: com sessionStorage.getItem/setItem lançando erro, a splash aparece e some após 1500 ms sem erro', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError: sessionStorage is restricted')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError: sessionStorage is restricted')
    })

    renderSplashGate('/login', 1500)

    expect(screen.getByRole('img', { name: 'Liftech' })).toBeInTheDocument()
    expect(screen.queryByText('conteúdo')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it("SPL-07: ao exibir, sessionStorage['liftech.splashSeen'] vale '1'; segundo render não mostra splash", () => {
    const { unmount } = renderSplashGate('/login', 1500)

    expect(sessionStorage.getItem(SEEN_KEY)).toBe('1')

    act(() => {
      vi.advanceTimersByTime(1500)
    })
    unmount()

    // Segunda montagem na mesma "sessão"
    renderSplashGate('/login', 1500)
    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('Edge: desmontar antes de 1500 ms limpa o timer sem avisos', () => {
    const { unmount } = renderSplashGate('/login', 1500)
    expect(screen.getByRole('img', { name: 'Liftech' })).toBeInTheDocument()

    unmount()

    // Avançar tempo após desmontagem
    act(() => {
      vi.advanceTimersByTime(1500)
    })
  })

  it('SPLASH_MS é 0 em ambiente de teste e SplashGate sem prop renderiza direto', () => {
    expect(SPLASH_MS).toBe(0)

    render(
      <MemoryRouter initialEntries={['/login']}>
        <SplashGate>
          <p>direto</p>
        </SplashGate>
      </MemoryRouter>
    )

    expect(screen.queryByRole('img', { name: 'Liftech' })).not.toBeInTheDocument()
    expect(screen.getByText('direto')).toBeInTheDocument()
  })

  it('shouldShowSplash retorna false para durationMs <= 0', () => {
    expect(shouldShowSplash('/login', 0)).toBe(false)
    expect(shouldShowSplash('/login', -1)).toBe(false)
  })
})

import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, vi } from 'vitest'
import PoliticaPrivacidadePage from '../../pages/PoliticaPrivacidadePage'
import i18n from '../../config/i18n'

const mockedNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

describe('PoliticaPrivacidadePage', () => {
  it('renders the complete privacy policy page with all 15 sections and metadata', () => {
    render(
      <MemoryRouter>
        <PoliticaPrivacidadePage />
      </MemoryRouter>
    )

    // Page title and headers
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Política de Privacidade')
    expect(screen.getByText(/Última atualização: 28 de setembro de 2026/i)).toBeInTheDocument()

    // Sidebar metadata
    expect(screen.getByText('ÚLTIMA ATUALIZAÇÃO:')).toBeInTheDocument()
    expect(screen.getByText('28 de setembro de 2026')).toBeInTheDocument()
    expect(screen.getByText('EMPRESA:')).toBeInTheDocument()
    expect(screen.getByText('LifTech')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /voltar à tela inicial/i })).toBeInTheDocument()

    // Sample sections
    expect(screen.getByRole('heading', { name: /1\. Dados coletados/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /2\. Dados provenientes do hardware/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /3\. Histórico de utilização das empilhadeiras/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /4\. Eventos de segurança e acidentes/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /5\. Finalidade do tratamento dos dados/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /6\. Acesso às informações/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /7\. Compartilhamento de dados/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /8\. Armazenamento e retenção/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /9\. Segurança/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /10\. Senhas e credenciais/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /11\. Cookies e tecnologias semelhantes/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /12\. Direitos dos usuários/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /13\. Privacidade dos colaboradores/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /14\. Alterações nesta Política de Privacidade/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /15\. Contato/i })).toBeInTheDocument()

    // Footer
    expect(screen.getByText('Liftech', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText(/Sistema acadêmico para gestão, monitoramento e segurança/i)).toBeInTheDocument()
  })

  it('navigates directly to the home screen when clicking the back button', () => {
    mockedNavigate.mockClear()
    render(
      <MemoryRouter>
        <PoliticaPrivacidadePage />
      </MemoryRouter>
    )

    const backButton = screen.getByRole('button', { name: /voltar à tela inicial/i })
    fireEvent.click(backButton)

    expect(mockedNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('renders all 15 sections with correct IDs', () => {
    render(
      <MemoryRouter>
        <PoliticaPrivacidadePage />
      </MemoryRouter>
    )
    for (let i = 1; i <= 15; i++) {
      expect(document.getElementById(`secao-${i}`)).toBeInTheDocument()
    }
  })

  it('has accessible landmark labels', () => {
    render(
      <MemoryRouter>
        <PoliticaPrivacidadePage />
      </MemoryRouter>
    )
    expect(screen.getByRole('complementary')).toHaveAttribute('aria-label')
    expect(screen.getByRole('navigation', { name: /sumário|table of contents/i })).toBeInTheDocument()
  })

  it('renders the table of contents with translated links', () => {
    render(
      <MemoryRouter>
        <PoliticaPrivacidadePage />
      </MemoryRouter>
    )
    const nav = screen.getByRole('navigation', { name: /sumário|table of contents/i })
    const links = nav.querySelectorAll('a')
    expect(links).toHaveLength(15)
    links.forEach((link, idx) => {
      expect(link).toHaveAttribute('href', `#secao-${idx + 1}`)
    })
  })

  it('renders severity items from translations (not hardcoded)', () => {
    render(
      <MemoryRouter>
        <PoliticaPrivacidadePage />
      </MemoryRouter>
    )
    // Verifica que as severidades são renderizadas via i18n
    expect(screen.getByText(/média: frenagem brusca|medium: sudden braking/i)).toBeInTheDocument()
    expect(screen.getByText(/alta: colisão|high: collision/i)).toBeInTheDocument()
    expect(screen.getByText(/crítica: tombamento|critical: overturning/i)).toBeInTheDocument()
  })

  it('navigates with replace to avoid history loop', () => {
    mockedNavigate.mockClear()
    render(
      <MemoryRouter>
        <PoliticaPrivacidadePage />
      </MemoryRouter>
    )
    const backButton = screen.getByRole('button', { name: /voltar/i })
    fireEvent.click(backButton)
    expect(mockedNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('renders translated content correctly across all supported languages', async () => {
    const expectations: Record<string, { title: string; mediumSev: string }> = {
      'pt-BR': { title: 'Política de Privacidade', mediumSev: 'Média: frenagem brusca.' },
      'en-US': { title: 'Privacy Policy', mediumSev: 'Medium: sudden braking.' },
      'es': { title: 'Política de Privacidad', mediumSev: 'Media: frenado brusco.' },
      'fr': { title: 'Politique de Confidentialité', mediumSev: 'Moyenne : freinage brusque.' },
      'de': { title: 'Datenschutzerklärung', mediumSev: 'Mittel: plötzliches Bremsen.' },
      'ja': { title: 'プライバシーポリシー', mediumSev: '中：急ブレーキ。' },
      'ru': { title: 'Политика конфиденциальности', mediumSev: 'Средняя: резкое торможение.' },
    }

    for (const [lang, expected] of Object.entries(expectations)) {
      await i18n.changeLanguage(lang)
      const { unmount } = render(
        <MemoryRouter>
          <PoliticaPrivacidadePage />
        </MemoryRouter>
      )
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(expected.title)
      expect(screen.getByText(expected.mediumSev)).toBeInTheDocument()
      unmount()
    }

    // Reset back to pt-BR
    await i18n.changeLanguage('pt-BR')
  })
})

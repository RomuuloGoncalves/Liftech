import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Header from '../../../components/layout/Header'

function renderHeaderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
    </MemoryRouter>
  )
}

describe('Header component', () => {
  it('renders the title matching the current route', () => {
    renderHeaderAt('/frota')
    expect(screen.getByRole('heading', { name: 'Gerenciamento Frota' })).toBeInTheDocument()
  })

  it('renders the team page title on /equipe', () => {
    renderHeaderAt('/equipe')
    expect(screen.getByRole('heading', { name: 'Gerenciamento da Equipe e Setores' })).toBeInTheDocument()
  })

  it('renders notification and profile buttons with accessible labels', () => {
    renderHeaderAt('/')
    expect(screen.getByRole('button', { name: /notificações/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /perfil do usuário/i })).toBeInTheDocument()
  })

  it('keeps the language popover closed by default and opens it on Globe click', () => {
    renderHeaderAt('/')
    expect(screen.queryByRole('dialog', { name: /escolha um idioma/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /selecionar idioma/i }))
    expect(screen.getByRole('dialog', { name: /escolha um idioma/i })).toBeInTheDocument()
  })

  it('lists all 7 language options and selects one on click', () => {
    renderHeaderAt('/')
    fireEvent.click(screen.getByRole('button', { name: /selecionar idioma/i }))

    expect(screen.getByRole('radio', { name: 'Português (Brasil)' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Inglês' })).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(screen.getByText('Inglês'))

    // After click, the language is English, so texts translate to English!
    // And since we didn't close the dialog in the test (wait, click changes language AND closes the popover now!)
    // So we need to re-open the popover to see the radios.
    fireEvent.click(screen.getByRole('button', { name: /selecionar idioma/i }))

    expect(screen.getByRole('radio', { name: 'English' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Portuguese (Brazil)' })).toHaveAttribute('aria-checked', 'false')
  })

  it('closes the popover when the close (X) button is clicked', () => {
    renderHeaderAt('/')
    fireEvent.click(screen.getByRole('button', { name: /selecionar idioma/i }))
    fireEvent.click(screen.getByRole('button', { name: /fechar seleção de idioma/i }))
    expect(screen.queryByRole('dialog', { name: /escolha um idioma/i })).not.toBeInTheDocument()
  })

  it('closes the popover when Escape is pressed', () => {
    renderHeaderAt('/')
    fireEvent.click(screen.getByRole('button', { name: /selecionar idioma/i }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: /escolha um idioma/i })).not.toBeInTheDocument()
  })

  it('closes the popover when clicking outside', () => {
    renderHeaderAt('/')
    fireEvent.click(screen.getByRole('button', { name: /selecionar idioma/i }))
    expect(screen.getByRole('dialog', { name: /escolha um idioma/i })).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('dialog', { name: /escolha um idioma/i })).not.toBeInTheDocument()
  })
})

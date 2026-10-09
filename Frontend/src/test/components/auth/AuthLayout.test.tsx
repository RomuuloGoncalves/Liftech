import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import AuthLayout from '../../../components/auth/AuthLayout'

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={['/login/colaborador']}>
      <AuthLayout title="Título" subtitle="Subtítulo">
        <p>conteúdo</p>
      </AuthLayout>
    </MemoryRouter>,
  )

describe('AuthLayout', () => {
  it('renders title, subtitle and children', () => {
    renderLayout()
    expect(screen.getByRole('heading', { level: 1, name: 'Título' })).toBeInTheDocument()
    expect(screen.getByText('Subtítulo')).toBeInTheDocument()
    expect(screen.getByText('conteúdo')).toBeInTheDocument()
  })

  it('renders the three tabs in order and marks the current route', () => {
    renderLayout()
    const links = within(screen.getByRole('navigation', { name: 'Tipo de acesso' })).getAllByRole('link')
    expect(links.map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Solicite o acesso', '/solicitar-acesso'],
      ['Entrar Administrador', '/login'],
      ['Colaborador', '/login/colaborador'],
    ])
    expect(links[2]).toHaveAttribute('aria-current', 'page')
    expect(links[0]).not.toHaveAttribute('aria-current')
    expect(links[1]).not.toHaveAttribute('aria-current')
  })

  it('renders the hero with the three info cards', () => {
    renderLayout()
    expect(screen.getByRole('heading', { level: 2, name: 'Comece conosco' })).toBeInTheDocument()
    for (const title of ['Mais Segurança', 'Mais Controle', 'Mais eficiência']) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
  })
})

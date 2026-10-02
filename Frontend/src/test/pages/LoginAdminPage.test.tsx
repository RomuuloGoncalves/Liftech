import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LoginAdminPage from '../../pages/LoginAdminPage'

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginAdminPage />} />
        <Route path="/login/colaborador" element={<div>colaborador screen</div>} />
        <Route path="/" element={<div>home screen</div>} />
      </Routes>
    </MemoryRouter>
  )

const fillAndSubmit = (email: string, senha: string) => {
  if (email !== undefined) fireEvent.change(screen.getByLabelText('Email empresarial'), { target: { value: email } })
  if (senha !== undefined) fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginAdminPage', () => {
  it('renders the form fields and title', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email empresarial')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('navigates to / when both fields are filled with a valid email', () => {
    renderPage()
    fillAndSubmit('admin@empresa.com', 'minhasenha')
    expect(screen.getByText('home screen')).toBeInTheDocument()
  })

  it('shows an error and stays on /login when a field is empty', () => {
    renderPage()
    fillAndSubmit('', '')
    expect(screen.getAllByText('Campo obrigatório')).toHaveLength(2)
    expect(screen.queryByText('home screen')).not.toBeInTheDocument()
  })

  it('shows an invalid-email error and stays on /login for a malformed email', () => {
    renderPage()
    fillAndSubmit('abc', 'minhasenha')
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(screen.queryByText('home screen')).not.toBeInTheDocument()
  })

  it('navigates to /login/colaborador via the collaborator link', () => {
    renderPage()
    fireEvent.click(screen.getByRole('link', { name: 'Colaborador? Clique aqui!' }))
    expect(screen.getByText('colaborador screen')).toBeInTheDocument()
  })

  it('renders the forgot-password affordance without navigation', () => {
    renderPage()
    const forgot = screen.getByText('Esqueceu a senha? Clique aqui')
    expect(forgot.tagName).toBe('BUTTON')
  })
})

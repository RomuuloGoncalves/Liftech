import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SolicitarAcessoPage from '../../pages/SolicitarAcessoPage'

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/solicitar-acesso']}>
      <Routes>
        <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />
        <Route path="/login" element={<div>admin login screen</div>} />
        <Route path="/login/colaborador" element={<div>colaborador screen</div>} />
      </Routes>
    </MemoryRouter>
  )

const fillAndSubmit = (email: string, empresa: string, admin: string) => {
  fireEvent.change(screen.getByLabelText('Email empresarial'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Nome da Empresa'), { target: { value: empresa } })
  fireEvent.change(screen.getByLabelText('Nome Administrador'), { target: { value: admin } })
  fireEvent.click(screen.getByRole('button', { name: 'Solicitar acesso' }))
}

describe('SolicitarAcessoPage', () => {
  it('renders the 3 form fields', () => {
    renderPage()
    expect(screen.getByLabelText('Email empresarial')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome da Empresa')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome Administrador')).toBeInTheDocument()
  })

  it('replaces the form with a confirmation message on valid submit, without redirecting', () => {
    renderPage()
    fillAndSubmit('contato@empresa.com', 'Empresa LTDA', 'Maria Souza')

    expect(screen.getByText('Solicitação enviada!')).toBeInTheDocument()
    expect(screen.queryByLabelText('Email empresarial')).not.toBeInTheDocument()
    expect(screen.queryByText('admin login screen')).not.toBeInTheDocument()
  })

  it('shows an error and keeps the form visible when a field is empty', () => {
    renderPage()
    fillAndSubmit('', '', '')

    expect(screen.getAllByText('Campo obrigatório')).toHaveLength(3)
    expect(screen.queryByText('Solicitação enviada!')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email empresarial')).toBeInTheDocument()
  })

  it('shows an invalid-email error for a malformed email', () => {
    renderPage()
    fillAndSubmit('abc', 'Empresa LTDA', 'Maria Souza')

    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(screen.queryByText('Solicitação enviada!')).not.toBeInTheDocument()
  })

  it('navigates to /login/colaborador via the collaborator link', () => {
    renderPage()
    fireEvent.click(screen.getByRole('link', { name: 'Colaborador? Clique aqui!' }))
    expect(screen.getByText('colaborador screen')).toBeInTheDocument()
  })

  it('navigates to /login via the "Entrar Agora!" link', () => {
    renderPage()
    fireEvent.click(screen.getByRole('link', { name: 'Entrar Agora!' }))
    expect(screen.getByText('admin login screen')).toBeInTheDocument()
  })
})

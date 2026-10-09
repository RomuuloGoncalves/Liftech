import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SolicitarAcessoPage from '../../pages/SolicitarAcessoPage'
import { authService } from '../../services/authService'

vi.mock('../../services/authService')

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/solicitar-acesso']}>
      <Routes>
        <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />
        <Route path="/login" element={<div>admin login screen</div>} />
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
  beforeEach(() => {
    vi.mocked(authService.solicitarAcesso).mockReset().mockResolvedValue(undefined)
  })

  it('renders the 3 form fields', () => {
    renderPage()
    expect(screen.getByLabelText('Email empresarial')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome da Empresa')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome Administrador')).toBeInTheDocument()
  })

  it('sends trimmed data and shows a confirmation message, without redirecting', async () => {
    renderPage()
    fillAndSubmit('  contato@empresa.com ', ' Empresa LTDA ', ' Maria Souza  ')

    expect(await screen.findByText('Solicitação enviada!')).toBeInTheDocument()
    expect(authService.solicitarAcesso).toHaveBeenCalledWith({
      email: 'contato@empresa.com',
      nomeEmpresa: 'Empresa LTDA',
      nomeAdministrador: 'Maria Souza',
    })
    expect(screen.queryByLabelText('Email empresarial')).not.toBeInTheDocument()
    expect(screen.queryByText('admin login screen')).not.toBeInTheDocument()
  })

  it('shows an error and keeps the form visible when a field is empty', () => {
    renderPage()
    fillAndSubmit('', '', '')

    expect(screen.getAllByText('Campo obrigatório')).toHaveLength(3)
    expect(authService.solicitarAcesso).not.toHaveBeenCalled()
    expect(screen.queryByText('Solicitação enviada!')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Email empresarial')).toBeInTheDocument()
  })

  it('shows an invalid-email error for a malformed email', () => {
    renderPage()
    fillAndSubmit('abc', 'Empresa LTDA', 'Maria Souza')

    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(authService.solicitarAcesso).not.toHaveBeenCalled()
    expect(screen.queryByText('Solicitação enviada!')).not.toBeInTheDocument()
  })

  it('shows the duplicate message and keeps the form values on 409', async () => {
    vi.mocked(authService.solicitarAcesso).mockRejectedValue(
      new AxiosError('conflict', '409', undefined, undefined, { status: 409 } as AxiosResponse)
    )
    renderPage()
    fillAndSubmit('contato@empresa.com', 'Empresa LTDA', 'Maria Souza')

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma solicitação pendente para este email.')
    expect(screen.getByLabelText('Email empresarial')).toHaveValue('contato@empresa.com')
    expect(screen.getByLabelText('Nome da Empresa')).toHaveValue('Empresa LTDA')
    expect(screen.getByLabelText('Nome Administrador')).toHaveValue('Maria Souza')
    expect(screen.queryByText('Solicitação enviada!')).not.toBeInTheDocument()
  })

  it('does not render the removed cross links and divider', () => {
    renderPage()
    expect(screen.queryByText('Já tem cadastro?')).not.toBeInTheDocument()
    expect(screen.queryByText('ou')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Entrar Agora!' })).not.toBeInTheDocument()
  })
})

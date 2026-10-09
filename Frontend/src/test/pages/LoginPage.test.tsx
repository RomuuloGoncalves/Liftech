import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '../../pages/LoginPage'
import { authService, type RoleLogin } from '../../services/authService'

vi.mock('../../services/authService')

const login = vi.mocked(authService.login)

const renderPage = (role: RoleLogin) =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage role={role} />} />
        <Route path="/" element={<div>home screen</div>} />
      </Routes>
    </MemoryRouter>
  )

const submit = (field: string, value: string, senha: string) => {
  fireEvent.change(screen.getByLabelText(field), { target: { value } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginPage', () => {
  beforeEach(() => {
    login.mockReset()
  })

  it('renders admin fields and heading', () => {
    renderPage('admin')
    expect(screen.getByRole('heading', { level: 1, name: 'Bem-vindo de volta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email empresarial')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('renders colaborador fields and forgot-password button', () => {
    renderPage('colaborador')
    expect(screen.getByLabelText('Usuário')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Esqueceu a senha? Clique aqui!' })).toBeInTheDocument()
  })

  it('logs in admin and navigates home', async () => {
    login.mockResolvedValue({ _id: '1', nome: 'Admin', role: 'admin' })
    renderPage('admin')
    submit('Email empresarial', 'admin@empresa.com', 'minhasenha')
    expect(await screen.findByText('home screen')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith('admin', 'admin@empresa.com', 'minhasenha')
  })

  it('logs in colaborador', async () => {
    login.mockResolvedValue({ _id: '2', nome: 'João', role: 'colaborador' })
    renderPage('colaborador')
    submit('Usuário', 'joao', 'minhasenha')
    expect(await screen.findByText('home screen')).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith('colaborador', 'joao', 'minhasenha')
  })

  it('shows invalid-credentials on 401 and stays', async () => {
    login.mockRejectedValue(new AxiosError('x', '401', undefined, undefined, { status: 401 } as AxiosResponse))
    renderPage('admin')
    submit('Email empresarial', 'admin@empresa.com', 'errada')
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuário ou senha inválidos.')
    expect(screen.queryByText('home screen')).not.toBeInTheDocument()
  })

  it('shows network error when there is no response', async () => {
    login.mockRejectedValue(new AxiosError('Network Error'))
    renderPage('colaborador')
    submit('Usuário', 'joao', 'minhasenha')
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor.')
  })

  it('requires both fields', () => {
    renderPage('admin')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getAllByText('Campo obrigatório')).toHaveLength(2)
    expect(login).not.toHaveBeenCalled()
  })

  it('validates admin email', () => {
    renderPage('admin')
    submit('Email empresarial', 'abc', 'minhasenha')
    expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('disables the button while pending', async () => {
    login.mockReturnValue(new Promise(() => {}))
    renderPage('admin')
    submit('Email empresarial', 'admin@empresa.com', 'minhasenha')
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeDisabled()
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LoginColaboradorPage from '../../pages/LoginColaboradorPage'

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/login/colaborador']}>
      <Routes>
        <Route path="/login/colaborador" element={<LoginColaboradorPage />} />
        <Route path="/login" element={<div>admin screen</div>} />
        <Route path="/" element={<div>home screen</div>} />
      </Routes>
    </MemoryRouter>
  )

const fillAndSubmit = (usuario: string, senha: string) => {
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: usuario } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: senha } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

describe('LoginColaboradorPage', () => {
  it('renders the form fields', () => {
    renderPage()
    expect(screen.getByLabelText('Usuário')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
  })

  it('navigates to / when both fields are filled', () => {
    renderPage()
    fillAndSubmit('joao.silva', 'minhasenha')
    expect(screen.getByText('home screen')).toBeInTheDocument()
  })

  it('shows an error and stays on the page when a field is empty', () => {
    renderPage()
    fillAndSubmit('', '')
    expect(screen.getAllByText('Campo obrigatório')).toHaveLength(2)
    expect(screen.queryByText('home screen')).not.toBeInTheDocument()
  })

  it('navigates to /login via the administrator link', () => {
    renderPage()
    fireEvent.click(screen.getByRole('link', { name: 'Administrador? Clique aqui!' }))
    expect(screen.getByText('admin screen')).toBeInTheDocument()
  })
})

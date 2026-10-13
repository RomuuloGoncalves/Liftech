import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import EmployeeSettingsPage from '../../../pages/employee/EmployeeSettingsPage'

const Where = () => <output data-testid="where">{useLocation().pathname}</output>

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/funcionario/configuracoes']}>
      <Routes>
        <Route path="/funcionario/configuracoes" element={<><EmployeeSettingsPage /><Where /></>} />
        <Route path="/login/colaborador" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )

const path = () => screen.getByTestId('where').textContent
const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement

const USER = { _id: '1', nome: 'Bruno Souza', role: 'colaborador', telefone: '+55 99 99999999', cargo: 'Operador' }

describe('EmployeeSettingsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('token', 'tok')
    localStorage.setItem('user', JSON.stringify(USER))
  })

  it('shows the title, the "Geral" section and the "Dados do usuário" card', () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Configurações' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Geral' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dados do usuário' })).toBeInTheDocument()
  })

  it('shows Nome, Telefone and Cargo as read-only fields with their labels', () => {
    setup()
    for (const label of ['Nome', 'Telefone', 'Cargo']) {
      expect(field(label)).toHaveAttribute('readonly')
    }
  })

  it('fills the fields from the stored user', () => {
    setup()
    expect(field('Nome').value).toBe('Bruno Souza')
    expect(field('Telefone').value).toBe('+55 99 99999999')
    expect(field('Cargo').value).toBe('Operador')
  })

  it('shows — in Telefone and Cargo when the stored user does not have them', () => {
    localStorage.setItem('user', JSON.stringify({ _id: '1', nome: 'Ana', role: 'admin' }))
    setup()
    expect(field('Nome').value).toBe('Ana')
    expect(field('Telefone').value).toBe('—')
    expect(field('Cargo').value).toBe('—')
  })

  it.each([
    ['no stored user', () => localStorage.removeItem('user')],
    ['a stored user without nome', () => localStorage.setItem('user', JSON.stringify({ role: 'colaborador' }))],
    ['invalid JSON in the stored user', () => localStorage.setItem('user', '{not json')],
  ])('shows — in Nome with %s, without throwing', (_caso, prepare) => {
    prepare()
    setup()
    expect(field('Nome').value).toBe('—')
  })

  it('shows the change-request notice inside the card', () => {
    setup()
    expect(screen.getByText('Solicitação de alteração')).toBeInTheDocument()
    expect(screen.getByText(/solicite a mudança ao supervisor responsável/)).toBeInTheDocument()
  })

  it('"Deslogar-se" clears token and user and goes to the collaborator login', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Deslogar-se' }))
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(path()).toBe('/login/colaborador')
  })

  it('shows the feedback section with an editable textarea and no submit button', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Feedback & Sugestões' })).toBeInTheDocument()
    const box = screen.getByRole('textbox', { name: 'Como foi sua experiência?' })
    expect(box.tagName).toBe('TEXTAREA')
    expect(box).not.toHaveAttribute('readonly')
    fireEvent.change(box, { target: { value: 'Tudo certo' } })
    expect(box).toHaveValue('Tudo certo')
    expect(screen.queryByRole('button', { name: /enviar|send/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Deslogar-se', 'Política e Privacidade'])
  })

  it('drops the typed feedback when the screen is left and opened again', () => {
    const first = setup()
    fireEvent.change(screen.getByRole('textbox', { name: 'Como foi sua experiência?' }), { target: { value: 'Tudo certo' } })
    first.unmount()
    setup()
    expect(screen.getByRole('textbox', { name: 'Como foi sua experiência?' })).toHaveValue('')
  })

  it('"Política e Privacidade" does nothing: the route does not change', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Política e Privacidade' }))
    expect(path()).toBe('/funcionario/configuracoes')
  })
})

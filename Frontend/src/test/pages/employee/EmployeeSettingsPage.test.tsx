import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '../../../config/i18n'
import EmployeeSettingsPage from '../../../pages/employee/EmployeeSettingsPage'
import { feedbackService } from '../../../services/feedbackService'

const showMock = vi.fn()
const showErrorMock = vi.fn()

vi.mock('../../../components/common/Toast', () => ({
  useToast: () => ({ show: showMock, showError: showErrorMock }),
}))

vi.mock('../../../services/feedbackService', () => ({
  feedbackService: {
    enviar: vi.fn(),
  },
}))

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
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('pt-BR')
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

  it('shows the linked operator name in Nome instead of the user name', () => {
    localStorage.setItem('user', JSON.stringify({ ...USER, operador: { _id: 'o1', nome: 'Carlos Silva' } }))
    setup()
    expect(field('Nome').value).toBe('Carlos Silva')
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
    const card = screen.getByRole('heading', { name: 'Dados do usuário' }).closest('section') as HTMLElement
    expect(within(card).getByText('Solicitação de alteração')).toBeInTheDocument()
    expect(
      within(card).getByText('Para alterar seus dados, solicite a mudança ao supervisor responsável.')
    ).toBeInTheDocument()
  })

  it('renders the screen translated when the language is en-US', async () => {
    await i18n.changeLanguage('en-US')
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'User data' })).toBeInTheDocument()
    expect(screen.getByText('Change request')).toBeInTheDocument()
    expect(screen.getByText('To change your details, ask the supervisor in charge.')).toBeInTheDocument()
  })

  it('"Deslogar-se" clears token and user and goes to the collaborator login', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Deslogar-se' }))
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(path()).toBe('/login/colaborador')
  })

  it('shows the feedback section with an editable textarea and submit button', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Feedback & Sugestões' })).toBeInTheDocument()
    const box = screen.getByRole('textbox', { name: 'Como foi sua experiência?' })
    expect(box.tagName).toBe('TEXTAREA')
    expect(box).not.toHaveAttribute('readonly')
    fireEvent.change(box, { target: { value: 'Tudo certo' } })
    expect(box).toHaveValue('Tudo certo')
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(['Deslogar-se', 'Enviar', 'Política e Privacidade'])
  })

  it('botão "Enviar" visível abaixo da caixa', () => {
    setup()
    const botao = screen.getByRole('button', { name: 'Enviar' })
    expect(botao).toBeInTheDocument()
  })

  it('placeholder é "Digite uma sugestão de melhoria ou um feedback!" (não a chave)', () => {
    setup()
    expect(
      screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')
    ).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('employee.settings.feedbackPlaceholder')
    ).not.toBeInTheDocument()
  })

  it('"   " deixa "Enviar" desabilitado e o serviço não é chamado', () => {
    setup()
    const box = screen.getByRole('textbox', { name: 'Como foi sua experiência?' })
    const botao = screen.getByRole('button', { name: 'Enviar' })

    expect(botao).toBeDisabled()

    fireEvent.change(box, { target: { value: '   ' } })
    expect(botao).toBeDisabled()

    fireEvent.click(botao)
    expect(feedbackService.enviar).not.toHaveBeenCalled()
  })

  it('" boa " → enviar("boa"), toast de sucesso e caixa vazia', async () => {
    vi.mocked(feedbackService.enviar).mockResolvedValueOnce()
    setup()

    const box = screen.getByRole('textbox', { name: 'Como foi sua experiência?' })
    const botao = screen.getByRole('button', { name: 'Enviar' })

    fireEvent.change(box, { target: { value: ' boa ' } })
    expect(botao).not.toBeDisabled()

    fireEvent.click(botao)

    await waitFor(() => {
      expect(feedbackService.enviar).toHaveBeenCalledTimes(1)
      expect(feedbackService.enviar).toHaveBeenCalledWith('boa')
      expect(showMock).toHaveBeenCalledWith('Feedback enviado. Obrigado!')
      expect(box).toHaveValue('')
    })
  })

  it('serviço rejeita → toast de erro e texto mantido', async () => {
    vi.mocked(feedbackService.enviar).mockRejectedValueOnce(new Error('Erro de envio'))
    setup()

    const box = screen.getByRole('textbox', { name: 'Como foi sua experiência?' })
    const botao = screen.getByRole('button', { name: 'Enviar' })

    fireEvent.change(box, { target: { value: 'mensagem original' } })
    fireEvent.click(botao)

    await waitFor(() => {
      expect(feedbackService.enviar).toHaveBeenCalledWith('mensagem original')
      expect(showErrorMock).toHaveBeenCalledWith('Não foi possível enviar o feedback. Tente de novo.')
      expect(box).toHaveValue('mensagem original')
      expect(botao).not.toBeDisabled()
    })
  })

  it('dois cliques com promessa pendente → 1 chamada', async () => {
    let resolver: () => void = () => {}
    const pendente = new Promise<void>((resolve) => {
      resolver = resolve
    })
    vi.mocked(feedbackService.enviar).mockReturnValueOnce(pendente)
    setup()

    const box = screen.getByRole('textbox', { name: 'Como foi sua experiência?' })
    const botao = screen.getByRole('button', { name: 'Enviar' })

    fireEvent.change(box, { target: { value: 'clique duplo' } })
    fireEvent.click(botao)
    fireEvent.click(botao)

    expect(feedbackService.enviar).toHaveBeenCalledTimes(1)

    resolver()
    await waitFor(() => {
      expect(box).toHaveValue('')
    })
  })

  it('caixa tem maxLength 1000', () => {
    setup()
    const box = screen.getByRole('textbox', { name: 'Como foi sua experiência?' })
    expect(box).toHaveAttribute('maxLength', '1000')
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

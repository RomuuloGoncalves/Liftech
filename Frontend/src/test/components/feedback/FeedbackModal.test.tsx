import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import FeedbackModal from '../../../components/feedback/FeedbackModal'
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

describe('FeedbackModal', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o título, o rótulo, o placeholder e o botão "Enviar" em pt-BR', () => {
    render(<FeedbackModal onClose={onClose} />)

    expect(screen.getByRole('dialog', { name: 'Envie-nos feedback ou uma sugestão' })).toBeInTheDocument()
    expect(screen.getByText('Como foi sua experiência?')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
  })

  it('textarea recebe o foco ao montar', () => {
    render(<FeedbackModal onClose={onClose} />)

    const textarea = screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')
    expect(textarea).toHaveFocus()
  })

  it('"Enviar" desabilitado com "" e com "   "; submit pelo Enter do form não chama o serviço', () => {
    render(<FeedbackModal onClose={onClose} />)

    const botao = screen.getByRole('button', { name: 'Enviar' })
    const textarea = screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')

    expect(botao).toBeDisabled()

    fireEvent.change(textarea, { target: { value: '   ' } })
    expect(botao).toBeDisabled()

    const form = botao.closest('form')!
    fireEvent.submit(form)

    expect(feedbackService.enviar).not.toHaveBeenCalled()
  })

  it('com "  ideia  ", clique chama enviar("ideia"), mostra "Feedback enviado. Obrigado!" e chama onClose', async () => {
    vi.mocked(feedbackService.enviar).mockResolvedValueOnce()

    render(<FeedbackModal onClose={onClose} />)

    const textarea = screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')
    const botao = screen.getByRole('button', { name: 'Enviar' })

    fireEvent.change(textarea, { target: { value: '  ideia  ' } })
    expect(botao).not.toBeDisabled()

    fireEvent.click(botao)

    await waitFor(() => {
      expect(feedbackService.enviar).toHaveBeenCalledTimes(1)
      expect(feedbackService.enviar).toHaveBeenCalledWith('ideia')
      expect(showMock).toHaveBeenCalledWith('Feedback enviado. Obrigado!')
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('serviço rejeita → toast de erro, onClose não chamado, texto continua no textarea e o botão volta a habilitar', async () => {
    vi.mocked(feedbackService.enviar).mockRejectedValueOnce(new Error('Falha de rede'))

    render(<FeedbackModal onClose={onClose} />)

    const textarea = screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')
    const botao = screen.getByRole('button', { name: 'Enviar' })

    fireEvent.change(textarea, { target: { value: 'meu texto' } })
    fireEvent.click(botao)

    await waitFor(() => {
      expect(feedbackService.enviar).toHaveBeenCalledWith('meu texto')
      expect(showErrorMock).toHaveBeenCalledWith('Não foi possível enviar o feedback. Tente de novo.')
      expect(onClose).not.toHaveBeenCalled()
      expect(textarea).toHaveValue('meu texto')
      expect(botao).not.toBeDisabled()
    })
  })

  it('dois cliques rápidos com promessa pendente → 1 chamada', async () => {
    let resolver: () => void = () => {}
    const pendente = new Promise<void>((resolve) => {
      resolver = resolve
    })
    vi.mocked(feedbackService.enviar).mockReturnValueOnce(pendente)

    render(<FeedbackModal onClose={onClose} />)

    const textarea = screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')
    const botao = screen.getByRole('button', { name: 'Enviar' })

    fireEvent.change(textarea, { target: { value: 'teste duplo' } })
    fireEvent.click(botao)
    fireEvent.click(botao)

    expect(feedbackService.enviar).toHaveBeenCalledTimes(1)

    resolver()
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('X e Esc chamam onClose sem chamar o serviço', () => {
    const { unmount } = render(<FeedbackModal onClose={onClose} />)

    const botaoFechar = screen.getByRole('button', { name: 'Fechar' })
    fireEvent.click(botaoFechar)

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(feedbackService.enviar).not.toHaveBeenCalled()

    unmount()
    onClose.mockReset()

    render(<FeedbackModal onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(feedbackService.enviar).not.toHaveBeenCalled()
  })

  it('textarea tem maxLength 1000', () => {
    render(<FeedbackModal onClose={onClose} />)

    const textarea = screen.getByPlaceholderText('Digite uma sugestão de melhoria ou um feedback!')
    expect(textarea).toHaveAttribute('maxLength', '1000')
  })
})

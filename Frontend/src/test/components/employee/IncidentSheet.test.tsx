import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../../App'
import { ToastProvider } from '../../../components/common/Toast'
import IncidentSheet from '../../../components/employee/IncidentSheet'
import { incidentService } from '../../../services/incidentService'
import { MACHINES } from '../../../data/machines'
import { resetWorkSession } from '../../../hooks/useWorkSession'
import { sessionService } from '../../../services/sessionService'

vi.mock('../../../services/sessionService', () => ({
  sessionService: { atual: vi.fn(), iniciar: vi.fn(), encerrar: vi.fn(), listar: vi.fn().mockResolvedValue([]) },
}))
vi.mock('../../../services/machineService', async () => {
  const { MACHINES } = await import('../../../data/machines')
  return { machineService: { listar: vi.fn().mockResolvedValue(MACHINES) } }
})

const atual = vi.mocked(sessionService.atual)

vi.mock('../../../services/incidentService', () => ({ incidentService: { reportar: vi.fn(), listar: vi.fn() } }))
const reportar = vi.mocked(incidentService.reportar)
const USER = { _id: 'u1', nome: 'Bruno', role: 'colaborador', operador: { _id: 'o1', nome: 'Carlos Silva' } }
const submit = () => act(async () => {
  fireEvent.click(footerButton('Enviar ocorrência'))
})

const machine = MACHINES[0]

const renderSheet = async (props: Partial<React.ComponentProps<typeof IncidentSheet>> = {}) => {
  const onClose = vi.fn()
  const onSubmitted = vi.fn()
  render(
    <ToastProvider>
      <IncidentSheet open onClose={onClose} onSubmitted={onSubmitted} {...props} />
    </ToastProvider>
  )
  await act(async () => {})
  return { onClose, onSubmitted }
}

const field = (name: string) => screen.getByLabelText(name) as HTMLInputElement
const footerButton = (name: string) => within(screen.getByRole('dialog')).getAllByRole('button', { name }).at(-1)!

const fillAll = () => {
  fireEvent.change(field('Nome funcionário'), { target: { value: 'Maria' } })
  fireEvent.change(field('Setor'), { target: { value: 'Expedição' } })
  fireEvent.change(field('Máquina'), { target: { value: 'Titan-X' } })
  fireEvent.change(field('Horário'), { target: { value: '14:30' } })
}

describe('IncidentSheet', () => {
  beforeEach(() => {
    resetWorkSession()
    atual.mockReset().mockResolvedValue(null)
    reportar.mockReset().mockResolvedValue({} as never)
    localStorage.setItem('user', JSON.stringify(USER))
  })

  it('shows the 4 fields, placeholders and both buttons', async () => {
    await renderSheet()
    expect(screen.getByRole('dialog', { name: 'Reporte uma ocorrência' })).toBeInTheDocument()
    expect(field('Nome funcionário')).toHaveAttribute('placeholder', 'Ex: Alexandre Mattos')
    expect(field('Setor')).toHaveAttribute('placeholder', 'Ex: Expedição - Bloco B')
    expect(field('Máquina')).toHaveAttribute('placeholder', 'Ex: Empilhadeira Elétrica Titan-X')
    expect(field('Horário')).toHaveAttribute('type', 'time')
    expect(footerButton('Cancelar')).toBeInTheDocument()
    expect(footerButton('Enviar ocorrência')).toBeInTheDocument()
  })

  it('does not render when closed', async () => {
    await renderSheet({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('falls back to the user name when there is no linked operator', async () => {
    localStorage.setItem('user', JSON.stringify({ ...USER, operador: null }))
    await renderSheet()
    expect(field('Nome funcionário').value).toBe('Bruno')
  })

  it('without a session fills only the linked operator name', async () => {
    await renderSheet()
    expect(field('Nome funcionário').value).toBe('Carlos Silva')
    expect(field('Setor').value).toBe('')
    expect(field('Máquina').value).toBe('')
    expect(field('Horário').value).toBe('')
  })

  it('with an active session fills sector and machine from the session machine, still editable', async () => {
    atual.mockResolvedValue({
      _id: 's1',
      machineId: machine.id,
      maquina: { nome: machine.nome, identificacao: machine.identificacao, setor: machine.setor },
      operador: { nome: 'Carlos' },
      inicio: new Date().toISOString(),
      fim: null,
    })
    await renderSheet()
    expect(field('Setor').value).toBe(machine.setor)
    expect(field('Máquina').value).toBe(machine.nome)
    fireEvent.change(field('Setor'), { target: { value: 'Outro' } })
    expect(field('Setor').value).toBe('Outro')
  })

  it('shows the required message under every empty field and does not submit', async () => {
    const { onClose, onSubmitted } = await renderSheet()
    fireEvent.change(field('Nome funcionário'), { target: { value: '' } })
    fireEvent.click(footerButton('Enviar ocorrência'))

    const messages = screen.getAllByText('Campo obrigatório')
    expect(messages).toHaveLength(4)
    for (const label of ['Nome funcionário', 'Setor', 'Máquina', 'Horário']) {
      const input = field(label)
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(document.getElementById(input.getAttribute('aria-describedby')!)).toHaveTextContent('Campo obrigatório')
    }
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.queryByText('Ocorrência enviada com sucesso')).not.toBeInTheDocument()
  })

  it('flags only the fields still empty and clears the message when typing', async () => {
    await renderSheet()
    fireEvent.change(field('Setor'), { target: { value: 'Expedição' } })
    fireEvent.click(footerButton('Enviar ocorrência'))
    expect(screen.getAllByText('Campo obrigatório')).toHaveLength(2)
    expect(field('Setor')).toHaveAttribute('aria-invalid', 'false')
    fireEvent.change(field('Máquina'), { target: { value: 'Titan-X' } })
    expect(screen.getAllByText('Campo obrigatório')).toHaveLength(1)
  })

  it('a valid submit sends the time to the API, calls onSubmitted, closes and shows the toast', async () => {
    const { onClose, onSubmitted } = await renderSheet()
    fillAll()
    await submit()
    expect(reportar).toHaveBeenCalledWith({ horario: '14:30' })
    expect(screen.queryByText('Campo obrigatório')).not.toBeInTheDocument()
    expect(onSubmitted).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Ocorrência enviada com sucesso')).toBeInTheDocument()
  })

  it('keeps the sheet open and shows the error toast when the API fails', async () => {
    reportar.mockRejectedValue(new Error('409'))
    const { onClose, onSubmitted } = await renderSheet()
    fillAll()
    await submit()
    expect(onClose).not.toHaveBeenCalled()
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Não foi possível enviar a ocorrência. Tente novamente.')).toBeInTheDocument()
    expect(screen.queryByText('Ocorrência enviada com sucesso')).not.toBeInTheDocument()
  })

  it('does not call the API when a field is missing', async () => {
    await renderSheet()
    await submit()
    expect(reportar).not.toHaveBeenCalled()
  })

  it('Cancelar closes without submitting', async () => {
    const { onClose, onSubmitted } = await renderSheet()
    fillAll()
    fireEvent.click(footerButton('Cancelar'))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onSubmitted).not.toHaveBeenCalled()
    expect(reportar).not.toHaveBeenCalled()
    expect(screen.queryByText('Ocorrência enviada com sucesso')).not.toBeInTheDocument()
  })
})

const Path = () => <output data-testid="path">{useLocation().pathname}</output>

describe('Incident route', () => {
  beforeEach(() => {
    resetWorkSession()
    atual.mockReset().mockResolvedValue(null)
    reportar.mockReset().mockResolvedValue({} as never)
    localStorage.setItem('user', JSON.stringify(USER))
  })

  const renderRoute = async () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/funcionario/historico', '/funcionario/ocorrencia']} initialIndex={1}>
          <App />
          <Path />
        </MemoryRouter>
      </ToastProvider>
    )
    await act(async () => {})
  }

  it('opens the sheet and a valid submit goes back keeping the toast', async () => {
    await renderRoute()
    expect(screen.getByRole('dialog', { name: 'Reporte uma ocorrência' })).toBeInTheDocument()
    fillAll()
    await submit()
    expect(screen.getByTestId('path')).toHaveTextContent('/funcionario/historico')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Ocorrência enviada com sucesso')).toBeInTheDocument()
  })

  it('Cancelar goes back without a toast', async () => {
    await renderRoute()
    fireEvent.click(footerButton('Cancelar'))
    expect(screen.getByTestId('path')).toHaveTextContent('/funcionario/historico')
    expect(screen.queryByText('Ocorrência enviada com sucesso')).not.toBeInTheDocument()
  })

  it('goes to /funcionario when there is no history', () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/funcionario/ocorrencia']}>
          <App />
          <Path />
        </MemoryRouter>
      </ToastProvider>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.getByTestId('path')).toHaveTextContent(/^\/funcionario$/)
  })
})

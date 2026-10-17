import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BranchSelector from '../../../components/layout/BranchSelector'
import { ActiveBranchProvider } from '../../../context/ActiveBranchContext'
import i18n from '../../../config/i18n'
import { branchService } from '../../../services/branchService'
import type { Filial, UsuarioLogado } from '../../../services/authService'

vi.mock('../../../services/branchService', () => ({
  branchService: { listar: vi.fn(), criar: vi.fn(), renomear: vi.fn(), remover: vi.fn() },
}))

const listar = vi.mocked(branchService.listar)
const criar = vi.mocked(branchService.criar)
const renomear = vi.mocked(branchService.renomear)
const remover = vi.mocked(branchService.remover)

const F1: Filial = { _id: 'f1', nome: 'Filial 01', matriz: true }
const F2: Filial = { _id: 'f2', nome: 'Filial 02', matriz: false }

const login = (escopo: 'empresa' | 'filiais', filiais: Filial[]) => {
  const user: UsuarioLogado = {
    _id: 'u1',
    nome: 'Ana',
    role: 'admin',
    empresa: { _id: 'e1', nome: 'Acme' },
    escopo,
    filiais,
  }
  localStorage.setItem('user', JSON.stringify(user))
}

const renderSelector = (collapsed = false) =>
  render(
    <MemoryRouter>
      <ActiveBranchProvider>
        <BranchSelector collapsed={collapsed} />
        <button>outside</button>
      </ActiveBranchProvider>
    </MemoryRouter>
  )

const open = () => fireEvent.click(screen.getByRole('button', { name: /Filiais/ }))

const failWith = (status: number) =>
  new AxiosError('failed', 'ERR_BAD_REQUEST', undefined, null, {
    status,
    statusText: '',
    data: {},
    headers: {},
    config: {} as never,
  })

beforeEach(() => {
  listar.mockReset()
  criar.mockReset()
  renomear.mockReset()
  remover.mockReset()
})

describe('BranchSelector: choosing a branch', () => {
  it('shows the Filiais label and the Todas as filiais name while todas is active', () => {
    login('empresa', [F1, F2])

    renderSelector()

    expect(screen.getByText('Filiais')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Todas as filiais/ })).toHaveTextContent('Todas as filiais')
  })

  it('shows the name of the stored active branch', () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'f2')

    renderSelector()

    expect(screen.getByRole('button', { name: /Filiais/ })).toHaveTextContent('Filial 02')
  })

  it('renders nothing without a session', () => {
    const { container } = renderSelector()

    expect(container.querySelector('button[aria-haspopup]')).toBeNull()
    expect(screen.queryByText('Filiais')).not.toBeInTheDocument()
  })

  it('opens a listbox with one option per branch plus Todas as filiais, marking the active one', () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'f1')
    renderSelector()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()

    open()

    const options = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Todas as filiais', 'Filial 01', 'Filial 02'])
    expect(options.map((option) => option.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false'])
  })

  it('offers Todas as filiais to a filiais user with two branches', () => {
    login('filiais', [F1, F2])
    renderSelector()

    open()

    expect(screen.getByRole('option', { name: 'Todas as filiais' })).toBeInTheDocument()
  })

  it('does not offer Todas as filiais to a filiais user with one branch, who sees that branch', () => {
    login('filiais', [F2])
    renderSelector()

    expect(screen.getByRole('button', { name: /Filiais/ })).toHaveTextContent('Filial 02')
    open()

    expect(screen.queryByRole('option', { name: 'Todas as filiais' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('opens without options for a filiais user with no branches', () => {
    login('filiais', [])
    renderSelector()

    open()

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toEqual([])
  })

  it('selects the clicked option, stores it and closes the list', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()

    fireEvent.click(screen.getByRole('option', { name: 'Filial 02' }))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Filiais/ })).toHaveTextContent('Filial 02')
    expect(localStorage.getItem('liftech.activeBranch')).toBe('f2')
  })

  it('reflects the open state in aria-expanded', () => {
    login('empresa', [F1, F2])
    renderSelector()
    const trigger = screen.getByRole('button', { name: /Filiais/ })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('returns the focus to the trigger after selecting an option', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()

    fireEvent.click(screen.getByRole('option', { name: 'Filial 02' }))

    expect(screen.getByRole('button', { name: /Filiais/ })).toHaveFocus()
  })

  it('returns the focus to the trigger when Escape closes the list', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()
    screen.getByRole('option', { name: 'Filial 02' }).focus()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.getByRole('button', { name: /Filiais/ })).toHaveFocus()
  })

  it('returns the focus to the trigger when a click outside closes the list', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()

    fireEvent.mouseDown(screen.getByText('outside'))

    expect(screen.getByRole('button', { name: /Filiais/ })).toHaveFocus()
  })

  it('closes the list when Escape is pressed', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('closes the list when the user presses the mouse outside of it', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()

    fireEvent.mouseDown(screen.getByText('outside'))

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('keeps the list open when the mouse is pressed inside of it', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()

    fireEvent.mouseDown(screen.getByRole('listbox'))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('shows only the initial of the active branch when collapsed, named by aria-label and title', () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'f2')

    renderSelector(true)

    const trigger = screen.getByRole('button', { name: 'Filial 02' })
    expect(trigger).toHaveTextContent(/^F$/)
    expect(trigger).toHaveAttribute('aria-label', 'Filial 02')
    expect(trigger).toHaveAttribute('title', 'Filial 02')
    expect(screen.queryByText('Filiais')).not.toBeInTheDocument()
  })

  it('shows the translated label and option in en-US', async () => {
    await i18n.changeLanguage('en-US')
    login('empresa', [F1])

    renderSelector()
    fireEvent.click(screen.getByRole('button', { name: /Branches/ }))

    expect(screen.getByText('Branches')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'All branches' })).toBeInTheDocument()
  })
})

describe('BranchSelector: managing branches', () => {
  it('hides Gerenciar Filiais and Criar Filial from a filiais user', () => {
    login('filiais', [F1, F2])
    renderSelector()

    open()

    expect(screen.queryByRole('button', { name: 'Gerenciar Filiais' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Criar Filial' })).not.toBeInTheDocument()
  })

  it('shows Gerenciar Filiais and Criar Filial to an empresa user', () => {
    login('empresa', [F1])
    renderSelector()

    open()

    expect(screen.getByRole('button', { name: 'Gerenciar Filiais' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar Filial' })).toBeInTheDocument()
  })

  it('shows the name field with a disabled Confirmar and a Cancelar when Criar Filial is clicked', () => {
    login('empresa', [F1])
    renderSelector()
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Criar Filial' }))

    expect(screen.getByRole('textbox', { name: 'Nome da filial' })).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
  })

  it('keeps Confirmar disabled for a blank name', () => {
    login('empresa', [F1])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Criar Filial' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome da filial' }), { target: { value: '   ' } })

    expect(screen.getByRole('button', { name: 'Confirmar' })).toBeDisabled()
  })

  it('creates the branch with the trimmed name, then lists it and hides the field', async () => {
    login('empresa', [F1])
    criar.mockResolvedValue({ _id: 'f3', nome: 'Filial 03', matriz: false })
    listar.mockResolvedValue([F1, { _id: 'f3', nome: 'Filial 03', matriz: false }])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Criar Filial' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome da filial' }), { target: { value: '  Filial 03  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('option', { name: 'Filial 03' })).toBeInTheDocument()
    expect(criar).toHaveBeenCalledWith('Filial 03')
    expect(screen.queryByRole('textbox', { name: 'Nome da filial' })).not.toBeInTheDocument()
  })

  it('hides the field without calling the API when the creation is cancelled', () => {
    login('empresa', [F1])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Criar Filial' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome da filial' }), { target: { value: 'Filial 03' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('textbox', { name: 'Nome da filial' })).not.toBeInTheDocument()
    expect(criar).not.toHaveBeenCalled()
  })

  it('shows the save alert and keeps the field when creating fails', async () => {
    login('empresa', [F1])
    criar.mockRejectedValue(failWith(500))
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Criar Filial' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Nome da filial' }), { target: { value: 'Filial 03' } })

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar a filial.')
    expect(screen.getByRole('textbox', { name: 'Nome da filial' })).toHaveValue('Filial 03')
  })

  it('swaps the options for rename and delete buttons per branch in manage mode', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()

    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))

    expect(screen.queryAllByRole('option')).toEqual([])
    expect(screen.getByRole('button', { name: 'Renomear Filial 01' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir Filial 01' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Renomear Filial 02' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir Filial 02' })).toBeInTheDocument()
  })

  it('goes back to the options when Concluir is clicked in manage mode', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    expect(screen.queryByRole('button', { name: 'Gerenciar Filiais' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))

    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Renomear Filial 01' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gerenciar Filiais' })).toBeInTheDocument()
  })

  it('renames a branch from a prefilled field and shows the new name', async () => {
    login('empresa', [F1, F2])
    renomear.mockResolvedValue({ ...F2, nome: 'Galpão Sul' })
    listar.mockResolvedValue([F1, { ...F2, nome: 'Galpão Sul' }])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Renomear Filial 02' }))
    const field = screen.getByRole('textbox', { name: 'Nome da filial' })
    expect(field).toHaveValue('Filial 02')

    fireEvent.change(field, { target: { value: 'Galpão Sul' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('button', { name: 'Renomear Galpão Sul' })).toBeInTheDocument()
    expect(renomear).toHaveBeenCalledWith('f2', 'Galpão Sul')
    expect(screen.queryByRole('textbox', { name: 'Nome da filial' })).not.toBeInTheDocument()
  })

  it('shows the save alert and keeps the field when renaming fails', async () => {
    login('empresa', [F1, F2])
    renomear.mockRejectedValue(failWith(500))
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Renomear Filial 02' }))

    fireEvent.change(screen.getByRole('textbox', { name: 'Nome da filial' }), { target: { value: 'Galpão Sul' } })
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar a filial.')
    expect(screen.getByRole('textbox', { name: 'Nome da filial' })).toHaveValue('Galpão Sul')
  })

  it('asks for confirmation naming the branch before deleting', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))

    fireEvent.click(screen.getByRole('button', { name: 'Excluir Filial 02' }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Deseja excluir a filial Filial 02?')
    expect(remover).not.toHaveBeenCalled()
  })

  it('keeps the popup open while the delete dialog is open', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Filial 02' }))

    fireEvent.mouseDown(screen.getByRole('dialog'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Renomear Filial 02' })).toBeInTheDocument()
  })

  it('deletes the branch on confirmation and removes it from the list', async () => {
    login('empresa', [F1, F2])
    remover.mockResolvedValue(undefined)
    listar.mockResolvedValue([F1])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Filial 02' }))

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'Excluir Filial 02' })).not.toBeInTheDocument())
    expect(remover).toHaveBeenCalledWith('f2')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Excluir Filial 01' })).toBeInTheDocument()
  })

  it('does not delete when the dialog is cancelled', () => {
    login('empresa', [F1, F2])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Filial 02' }))

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(remover).not.toHaveBeenCalled()
  })

  it('goes back to Todas as filiais when the active branch is deleted', async () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'f2')
    remover.mockResolvedValue(undefined)
    listar.mockResolvedValue([F1])
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Filial 02' }))

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Filiais/ })).toHaveTextContent('Todas as filiais')
    )
  })

  it('closes the dialog and warns about the matriz or resources on a 409', async () => {
    login('empresa', [F1, F2])
    remover.mockRejectedValue(failWith(409))
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Filial 01' }))

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível excluir: a filial é a matriz ou ainda tem recursos.'
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the generic delete alert on any other delete error', async () => {
    login('empresa', [F1, F2])
    remover.mockRejectedValue(failWith(500))
    renderSelector()
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Gerenciar Filiais' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Filial 02' }))

    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Excluir' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível excluir a filial.')
  })
})

import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActiveBranchProvider, useActiveBranch } from '../../context/ActiveBranchContext'
import { branchService } from '../../services/branchService'
import type { Filial, UsuarioLogado } from '../../services/authService'

vi.mock('../../services/branchService', () => ({
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

const Probe = () => {
  const ctx = useActiveBranch()
  return (
    <div>
      <p data-testid="active">{ctx.activeBranch}</p>
      <p data-testid="branches">{ctx.branches.map((b) => b.nome).join(',')}</p>
      <p data-testid="flags">{`all=${ctx.showAll} manage=${ctx.canManage} user=${ctx.user?.nome ?? 'none'}`}</p>
      <button onClick={() => ctx.setActiveBranch('f2')}>set f2</button>
      <button onClick={() => void ctx.createBranch('Nova').catch(() => {})}>create</button>
      <button onClick={() => void ctx.renameBranch('f2', 'Renomeada').catch(() => {})}>rename</button>
      <button onClick={() => void ctx.removeBranch('f2').catch(() => {})}>remove</button>
    </div>
  )
}

const renderProbe = () =>
  render(
    <MemoryRouter>
      <ActiveBranchProvider>
        <Probe />
      </ActiveBranchProvider>
    </MemoryRouter>
  )

const active = () => screen.getByTestId('active').textContent

beforeEach(() => {
  listar.mockReset()
  criar.mockReset()
  renomear.mockReset()
  remover.mockReset()
})

describe('ActiveBranchProvider', () => {
  it('exposes the stored branch id when it belongs to the user', () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'f2')

    renderProbe()

    expect(active()).toBe('f2')
  })

  it('falls back to todas when the stored id is not one of the user branches', () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'zzz')

    renderProbe()

    expect(active()).toBe('todas')
  })

  it('is todas when nothing is stored', () => {
    login('empresa', [F1, F2])

    renderProbe()

    expect(active()).toBe('todas')
  })

  it('keeps a stored todas for a filiais user with two branches', () => {
    login('filiais', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'todas')

    renderProbe()

    expect(active()).toBe('todas')
  })

  it('selects the only branch of a filiais user even when todas is stored', () => {
    login('filiais', [F2])
    localStorage.setItem('liftech.activeBranch', 'todas')

    renderProbe()

    expect(active()).toBe('f2')
  })

  it('setActiveBranch writes liftech.activeBranch and exposes the new value', () => {
    login('empresa', [F1, F2])
    renderProbe()

    fireEvent.click(screen.getByText('set f2'))

    expect(active()).toBe('f2')
    expect(localStorage.getItem('liftech.activeBranch')).toBe('f2')
  })

  it('exposes todas, no branches and no user when there is no session', () => {
    renderProbe()

    expect(active()).toBe('todas')
    expect(screen.getByTestId('branches')).toHaveTextContent('')
    expect(screen.getByTestId('flags')).toHaveTextContent('all=false manage=false user=none')
  })

  it('treats an invalid stored user as no session', () => {
    localStorage.setItem('user', '{oops')

    renderProbe()

    expect(screen.getByTestId('flags')).toHaveTextContent('user=none')
  })

  it('treats a session saved without scope fields as having no branches', () => {
    localStorage.setItem('user', JSON.stringify({ _id: 'u1', nome: 'Ana', role: 'admin' }))

    renderProbe()

    expect(active()).toBe('todas')
    expect(screen.getByTestId('flags')).toHaveTextContent('all=false manage=false user=Ana')
  })

  it('exposes todas without throwing when localStorage throws', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled')
    })

    expect(() => renderProbe()).not.toThrow()
    expect(active()).toBe('todas')

    getItem.mockRestore()
    setItem.mockRestore()
  })

  it('shows all and allows managing for an empresa user', () => {
    login('empresa', [F1])

    renderProbe()

    expect(screen.getByTestId('flags')).toHaveTextContent('all=true manage=true')
  })

  it('shows all but does not allow managing for a filiais user with two branches', () => {
    login('filiais', [F1, F2])

    renderProbe()

    expect(screen.getByTestId('flags')).toHaveTextContent('all=true manage=false')
  })

  it('shows neither all nor manage for a filiais user with one branch', () => {
    login('filiais', [F1])

    renderProbe()

    expect(screen.getByTestId('flags')).toHaveTextContent('all=false manage=false')
  })

  it('createBranch posts the name, reloads the list and saves it in the session', async () => {
    login('empresa', [F1])
    criar.mockResolvedValue({ _id: 'f3', nome: 'Nova', matriz: false })
    listar.mockResolvedValue([F1, { _id: 'f3', nome: 'Nova', matriz: false }])
    renderProbe()

    fireEvent.click(screen.getByText('create'))

    await waitFor(() => expect(screen.getByTestId('branches')).toHaveTextContent('Filial 01,Nova'))
    expect(criar).toHaveBeenCalledWith('Nova')
    expect(JSON.parse(localStorage.getItem('user')!).filiais).toHaveLength(2)
  })

  it('renameBranch puts the name and shows the reloaded list', async () => {
    login('empresa', [F1, F2])
    renomear.mockResolvedValue({ ...F2, nome: 'Renomeada' })
    listar.mockResolvedValue([F1, { ...F2, nome: 'Renomeada' }])
    renderProbe()

    fireEvent.click(screen.getByText('rename'))

    await waitFor(() => expect(screen.getByTestId('branches')).toHaveTextContent('Filial 01,Renomeada'))
    expect(renomear).toHaveBeenCalledWith('f2', 'Renomeada')
  })

  it('removeBranch of the active branch deletes it and goes back to todas', async () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'f2')
    remover.mockResolvedValue(undefined)
    listar.mockResolvedValue([F1])
    renderProbe()
    expect(active()).toBe('f2')

    fireEvent.click(screen.getByText('remove'))

    await waitFor(() => expect(screen.getByTestId('branches')).toHaveTextContent(/^Filial 01$/))
    expect(remover).toHaveBeenCalledWith('f2')
    expect(active()).toBe('todas')
    expect(localStorage.getItem('liftech.activeBranch')).toBe('todas')
  })

  it('removeBranch of another branch keeps the active one', async () => {
    login('empresa', [F1, F2])
    localStorage.setItem('liftech.activeBranch', 'f1')
    remover.mockResolvedValue(undefined)
    listar.mockResolvedValue([F1])
    renderProbe()

    fireEvent.click(screen.getByText('remove'))

    await waitFor(() => expect(screen.getByTestId('branches')).toHaveTextContent(/^Filial 01$/))
    expect(active()).toBe('f1')
  })

  it('rejects with the API error and keeps the session when a mutation fails', async () => {
    login('empresa', [F1])
    const err = new Error('409')
    remover.mockRejectedValue(err)
    const Failing = () => {
      const { removeBranch } = useActiveBranch()
      return <button onClick={() => removeBranch('f1').catch((e) => (document.title = (e as Error).message))}>go</button>
    }
    render(
      <MemoryRouter>
        <ActiveBranchProvider>
          <Failing />
        </ActiveBranchProvider>
      </MemoryRouter>
    )

    await act(async () => {
      fireEvent.click(screen.getByText('go'))
    })

    expect(document.title).toBe('409')
    expect(listar).not.toHaveBeenCalled()
    expect(JSON.parse(localStorage.getItem('user')!).filiais).toEqual([F1])
  })

  it('without a provider useActiveBranch returns todas and no user', () => {
    render(<Probe />)

    expect(active()).toBe('todas')
    expect(screen.getByTestId('flags')).toHaveTextContent('all=false manage=false user=none')
  })
})

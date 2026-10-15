import React, { createContext, useContext, useReducer, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { authService, type Filial, type UsuarioLogado } from '../services/authService'
import { branchService } from '../services/branchService'

const STORAGE_KEY = 'liftech.activeBranch'
const ALL = 'todas'

interface ActiveBranchValue {
  user: UsuarioLogado | null
  branches: Filial[]
  activeBranch: string
  setActiveBranch: (id: string) => void
  showAll: boolean
  canManage: boolean
  createBranch: (nome: string) => Promise<void>
  renameBranch: (id: string, nome: string) => Promise<void>
  removeBranch: (id: string) => Promise<void>
}

const noop = () => Promise.resolve()

const ActiveBranchContext = createContext<ActiveBranchValue>({
  user: null,
  branches: [],
  activeBranch: ALL,
  setActiveBranch: () => {},
  showAll: false,
  canManage: false,
  createBranch: noop,
  renameBranch: noop,
  removeBranch: noop,
})

// eslint-disable-next-line react-refresh/only-export-components
export const useActiveBranch = (): ActiveBranchValue => useContext(ActiveBranchContext)

function readStored(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? ALL
  } catch {
    return ALL
  }
}

function writeStored(value: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    void 0
  }
}

export const ActiveBranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Re-render on navigation so a login or logout is picked up; the session in localStorage is the source of truth.
  useLocation()
  const [stored, setStored] = useState(readStored)
  const [, refresh] = useReducer((n: number) => n + 1, 0)

  const user = authService.getSession()
  const branches = user?.filiais ?? []
  const onlyBranch = user?.escopo === 'filiais' && branches.length === 1 ? branches[0]._id : null
  const activeBranch = onlyBranch ?? (branches.some((branch) => branch._id === stored) ? stored : ALL)

  const setActiveBranch = (id: string) => {
    writeStored(id)
    setStored(id)
  }

  const sync = async () => {
    authService.saveBranches(await branchService.listar())
    refresh()
  }

  const value: ActiveBranchValue = {
    user,
    branches,
    activeBranch,
    setActiveBranch,
    showAll: user?.escopo === 'empresa' || branches.length >= 2,
    canManage: user?.escopo === 'empresa',
    createBranch: async (nome) => {
      await branchService.criar(nome)
      await sync()
    },
    renameBranch: async (id, nome) => {
      await branchService.renomear(id, nome)
      await sync()
    },
    removeBranch: async (id) => {
      await branchService.remover(id)
      if (activeBranch === id) setActiveBranch(ALL)
      await sync()
    },
  }

  return <ActiveBranchContext.Provider value={value}>{children}</ActiveBranchContext.Provider>
}

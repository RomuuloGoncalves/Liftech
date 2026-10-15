import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../components/common/Toast'
import { sessionService, type Sessao } from '../services/sessionService'

interface State {
  session: Sessao | null
  ready: boolean
}

const listeners = new Set<() => void>()
let state: State = { session: null, ready: false }
// Token the open session was loaded for: a new login loads it again.
let loadedFor: string | null | undefined

function set(next: State) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function load() {
  const token = localStorage.getItem('token')
  if (loadedFor === token) return
  loadedFor = token
  set({ session: null, ready: false })
  sessionService.atual().then(
    (session) => loadedFor === token && set({ session, ready: true }),
    () => loadedFor === token && set({ session: null, ready: true })
  )
}

export function resetWorkSession() {
  loadedFor = undefined
  state = { session: null, ready: false }
}

export function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const [h, m, s] = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':')
}

export function useWorkSession() {
  const { t } = useTranslation()
  const { showError } = useToast()
  const { session, ready } = useSyncExternalStore(subscribe, () => state)
  const [now, setNow] = useState(() => Date.now())

  useEffect(load, [])

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [session])

  const start = useCallback(
    async (machineId: string) => {
      try {
        set({ session: await sessionService.iniciar(machineId), ready: true })
        return true
      } catch {
        showError(t('employee.session.startError'))
        return false
      }
    },
    [showError, t]
  )

  const end = useCallback(async () => {
    try {
      await sessionService.encerrar()
      set({ session: null, ready: true })
      return true
    } catch {
      showError(t('employee.session.endError'))
      return false
    }
  }, [showError, t])

  const elapsedSeconds = session ? Math.max(0, Math.floor((now - Date.parse(session.inicio)) / 1000)) : 0

  return { session, ready, start, end, elapsedSeconds }
}

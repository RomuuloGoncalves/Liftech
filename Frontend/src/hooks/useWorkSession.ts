import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

export interface WorkSession {
  machineId: string
  startedAt: number
}

export const SESSION_STORAGE_KEY = 'liftech.employee.session'

const listeners = new Set<() => void>()
let memoryRaw: string | null = null

function readRaw(): string | null {
  try {
    memoryRaw = sessionStorage.getItem(SESSION_STORAGE_KEY)
  } catch {
    return memoryRaw
  }
  return memoryRaw
}

function writeRaw(raw: string | null) {
  memoryRaw = raw
  try {
    if (raw === null) sessionStorage.removeItem(SESSION_STORAGE_KEY)
    else sessionStorage.setItem(SESSION_STORAGE_KEY, raw)
  } catch {
    memoryRaw = raw
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function parse(raw: string | null): WorkSession | null {
  if (!raw) return null
  try {
    const value = JSON.parse(raw)
    return typeof value?.machineId === 'string' && typeof value?.startedAt === 'number' ? value : null
  } catch {
    return null
  }
}

export function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds))
  const [h, m, s] = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60]
  return [h, m, s].map((part) => String(part).padStart(2, '0')).join(':')
}

export function useWorkSession() {
  const raw = useSyncExternalStore(subscribe, readRaw)
  const session = useMemo(() => parse(raw), [raw])
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!session) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [session])

  const start = useCallback((machineId: string) => {
    writeRaw(JSON.stringify({ machineId, startedAt: Date.now() } satisfies WorkSession))
  }, [])

  const end = useCallback(() => writeRaw(null), [])

  const elapsedSeconds = session ? Math.max(0, Math.floor((now - session.startedAt) / 1000)) : 0

  return { session, start, end, elapsedSeconds }
}

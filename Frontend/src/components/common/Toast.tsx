import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './Toast.module.css'

const TOAST_MS = 4000

interface ToastApi {
  show: (message: string) => void
  showError: (message: string) => void
}

const ToastContext = createContext<ToastApi>({ show: () => {}, showError: () => {} })

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastApi => useContext(ToastContext)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const [items, setItems] = useState<{ id: number; message: string; tone?: 'error' }[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const push = useCallback(
    (message: string, tone?: 'error') => {
      const id = nextId.current++
      setItems((prev) => [...prev, { id, message, tone }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_MS)
      )
    },
    [dismiss]
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const api = useMemo(
    () => ({ show: (message: string) => push(message), showError: (message: string) => push(message, 'error') }),
    [push]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div role="status" aria-live="polite" className={styles.region}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={`${styles.toast} ${item.tone === 'error' ? styles.error : ''}`}>
              {item.tone === 'error' ? (
                <CircleAlert size={16} aria-hidden="true" className={styles.icon} />
              ) : (
                <CircleCheck size={16} aria-hidden="true" className={styles.icon} />
              )}
              <span className={styles.message}>{item.message}</span>
              <button
                type="button"
                className={styles.close}
                aria-label={t('common.closeNotification')}
                onClick={() => dismiss(item.id)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </ToastContext.Provider>
  )
}

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CircleCheck, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './Toast.module.css'

const TOAST_MS = 4000

interface ToastApi {
  show: (message: string) => void
}

const ToastContext = createContext<ToastApi>({ show: () => {} })

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = (): ToastApi => useContext(ToastContext)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation()
  const [items, setItems] = useState<{ id: number; message: string }[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const show = useCallback(
    (message: string) => {
      const id = nextId.current++
      setItems((prev) => [...prev, { id, message }])
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

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div role="status" aria-live="polite" className={styles.region}>
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.toast}>
              <CircleCheck size={16} aria-hidden="true" className={styles.icon} />
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

import React, { useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './Modal.module.css'

interface ModalProps {
  title: string
  onClose: () => void
  badge?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  disableClose?: boolean
}

const Modal: React.FC<ModalProps> = ({ title, onClose, badge, footer, children, disableClose = false }) => {
  const { t } = useTranslation()
  const titleId = useId()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disableClose) return
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, disableClose])

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disableClose) return
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={styles.body}>
          <div className={styles.header}>
            <div className={styles.titleGroup}>
              <h2 id={titleId} className={styles.title}>
                {title}
              </h2>
              {badge}
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label={t('common.close')}
              onClick={onClose}
              disabled={disableClose}
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}

export default Modal

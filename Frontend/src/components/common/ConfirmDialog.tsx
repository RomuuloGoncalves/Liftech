import React from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import Spinner from './Spinner'
import buttons from './DialogButtons.module.css'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  /** Ação em andamento: trava os botões e mostra o spinner no confirmar. */
  busy?: boolean
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel, onConfirm, onCancel, busy = false }) => {
  const { t } = useTranslation()

  return (
    <Modal title={title} onClose={onCancel} disableClose={busy}>
      <p className={styles.message}>{message}</p>
      <div className={buttons.actions}>
        <button type="button" className={buttons.cancel} onClick={onCancel} disabled={busy}>
          {t('common.cancel')}
        </button>
        <button
          type="button"
          className={buttons.confirm}
          onClick={() => {
            if (!busy) onConfirm()
          }}
          disabled={busy}
          aria-busy={busy ? 'true' : undefined}
        >
          {busy && <Spinner size={14} />}
          {confirmLabel ?? t('team.delete')}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog

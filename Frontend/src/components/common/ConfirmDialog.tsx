import React from 'react'
import { useTranslation } from 'react-i18next'
import Modal from './Modal'
import buttons from './DialogButtons.module.css'
import styles from './ConfirmDialog.module.css'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, confirmLabel, onConfirm, onCancel }) => {
  const { t } = useTranslation()

  return (
    <Modal title={title} onClose={onCancel}> 
      <p className={styles.message}>{message}</p>
      <div className={buttons.actions}>
        <button type="button" className={buttons.cancel} onClick={onCancel}>
          {t('common.cancel')}
        </button>
        <button type="button" className={buttons.confirm} onClick={onConfirm}>
          {confirmLabel ?? t('team.delete')}
        </button>
      </div>
    </Modal>
  )
}

export default ConfirmDialog

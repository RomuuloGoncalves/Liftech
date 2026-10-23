import React, { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import { useToast } from '../common/Toast'
import dialogButtons from '../common/DialogButtons.module.css'
import { feedbackService } from '../../services/feedbackService'
import styles from './FeedbackModal.module.css'

interface FeedbackModalProps {
  onClose: () => void
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ onClose }) => {
  const { t } = useTranslation()
  const { show, showError } = useToast()
  const textareaId = useId()

  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  const valida = texto.trim().length > 0

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!valida || enviando) return

    setEnviando(true)
    try {
      await feedbackService.enviar(texto.trim())
      show(t('feedback.sent'))
      onClose()
    } catch {
      showError(t('feedback.error'))
      setEnviando(false)
    }
  }

  return (
    <Modal title={t('feedback.title')} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label htmlFor={textareaId} className={styles.label}>
          {t('feedback.question')}
        </label>
        <textarea
          id={textareaId}
          autoFocus
          maxLength={1000}
          className={styles.textarea}
          placeholder={t('feedback.placeholder')}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <div className={styles.actions}>
          <button
            type="submit"
            className={`${dialogButtons.confirm} ${styles.submit}`}
            disabled={!valida || enviando}
          >
            {t('feedback.send')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default FeedbackModal

import React, { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Info } from 'lucide-react'
import { authService, type UsuarioLogado } from '../../services/authService'
import { feedbackService } from '../../services/feedbackService'
import { useToast } from '../../components/common/Toast'
import dialogButtons from '../../components/common/DialogButtons.module.css'
import styles from './EmployeeSettingsPage.module.css'

const EMPTY = '—'

function readUser(): Partial<UsuarioLogado> {
  try {
    return JSON.parse(localStorage.getItem('user') ?? '{}') ?? {}
  } catch {
    return {}
  }
}

const EmployeeSettingsPage: React.FC = () => {
  const { t } = useTranslation()
  const { show, showError } = useToast()
  const navigate = useNavigate()
  const id = useId()

  const [feedbackTexto, setFeedbackTexto] = useState('')
  const [enviandoFeedback, setEnviandoFeedback] = useState(false)

  const feedbackValido = feedbackTexto.trim().length > 0

  const handleEnviarFeedback = async () => {
    if (!feedbackValido || enviandoFeedback) return

    setEnviandoFeedback(true)
    try {
      await feedbackService.enviar(feedbackTexto.trim())
      show(t('feedback.sent'))
      setFeedbackTexto('')
    } catch {
      showError(t('feedback.error'))
    } finally {
      setEnviandoFeedback(false)
    }
  }

  const user = readUser()
  const fields = [
    ['name', user.operador?.nome ?? user.nome],
    ['phone', user.telefone],
    ['position', user.cargo],
  ] as const

  const logout = () => {
    authService.logout()
    navigate('/login/colaborador')
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{t('employee.settings.title')}</h1>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('employee.settings.general')}</h2>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>{t('employee.settings.userData')}</h3>
          {fields.map(([key, value]) => (
            <div key={key} className={styles.field}>
              <label htmlFor={`${id}-${key}`} className={styles.label}>
                {t(`employee.settings.${key}`)}
              </label>
              <input id={`${id}-${key}`} className={styles.input} value={value || EMPTY} readOnly />
            </div>
          ))}
          
          <div className={styles.notice}>
            <Info size={20} className={styles.noticeIcon} aria-hidden="true" />
            <div className={styles.noticeContent}>
              <p className={styles.noticeTitle}>{t('employee.settings.changeNoticeTitle')}</p>
              <p className={styles.noticeText}>{t('employee.settings.changeNotice')}</p>
            </div>
          </div>

          <button type="button" className={styles.logout} onClick={logout}>
            {t('employee.settings.logout')}
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('employee.settings.feedbackTitle')}</h2>
        <label htmlFor={`${id}-feedback`} className={styles.label}>
          {t('employee.settings.feedbackQuestion')}
        </label>
        <textarea 
          id={`${id}-feedback`} 
          className={styles.textarea} 
          placeholder={t('employee.settings.feedbackPlaceholder')}
          maxLength={1000}
          value={feedbackTexto}
          onChange={(e) => setFeedbackTexto(e.target.value)}
        />
        <button
          type="button"
          className={`${dialogButtons.confirm} ${styles.send}`}
          disabled={!feedbackValido || enviandoFeedback}
          onClick={handleEnviarFeedback}
        >
          {t('feedback.send')}
        </button>
      </section>

      {/* ponytail: sem ação até existir a página de Política e Privacidade */}
      <button type="button" className={styles.privacy}>
        {t('employee.settings.privacy')}
      </button>
    </div>
  )
}

export default EmployeeSettingsPage
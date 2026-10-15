import React, { useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import { useFirstVisitLoading } from '../../hooks/useFirstVisitLoading'
import { authService, type UsuarioLogado } from '../../services/authService'
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
  const navigate = useNavigate()
  const loading = useFirstVisitLoading('employee-settings')
  const id = useId()

  if (loading) {
    return (
      <div className={styles.page}>
        <EmployeeSkeleton variant="settings" />
      </div>
    )
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
            <p className={styles.noticeTitle}>{t('employee.settings.changeNoticeTitle')}</p>
            <p className={styles.noticeText}>{t('employee.settings.changeNotice')}</p>
          </div>
        </div>
        <button type="button" className={styles.logout} onClick={logout}>
          {t('employee.settings.logout')}
        </button>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t('employee.settings.feedbackTitle')}</h2>
        <label htmlFor={`${id}-feedback`} className={styles.label}>
          {t('employee.settings.feedbackQuestion')}
        </label>
        <textarea id={`${id}-feedback`} className={styles.textarea} />
      </section>

      {/* ponytail: sem ação até existir a página de Política e Privacidade */}
      <button type="button" className={styles.privacy}>
        {t('employee.settings.privacy')}
      </button>
    </div>
  )
}

export default EmployeeSettingsPage

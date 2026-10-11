import React, { useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import forklift from '../../assets/employee-forklift.svg'
import { formatElapsed, useWorkSession } from '../../hooks/useWorkSession'
import styles from './EmployeeSessionPage.module.css'

const EmployeeSessionPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, end, elapsedSeconds } = useWorkSession()

  const ending = useRef(false)

  if (!session) return ending.current ? null : <Navigate to="/funcionario/maquinas" replace />

  const endSession = () => {
    ending.current = true
    end()
    navigate('/funcionario')
  }

  return (
    <section className={styles.page}>
      <img className={styles.illustration} src={forklift} alt="" />
      <p className={styles.description}>
        <Trans i18nKey="employee.session.description" components={{ b: <b /> }} />
      </p>
      <div className={styles.timer} role="timer" aria-label={t('employee.session.timerLabel')}>
        {formatElapsed(elapsedSeconds)}
      </div>
      <div className={styles.actions}>
        <button type="button" className={`${styles.button} ${styles.end}`} onClick={endSession}>
          {t('employee.session.end')}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.report}`}
          onClick={() => navigate('/funcionario/ocorrencia')}
        >
          {t('employee.session.reportIncident')}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

export default EmployeeSessionPage

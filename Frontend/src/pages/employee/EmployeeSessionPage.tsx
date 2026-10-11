import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import forkliftWebm from '../../assets/forklift.webm'
import forkliftMp4 from '../../assets/forklift.mp4'
import { formatElapsed, useWorkSession } from '../../hooks/useWorkSession'
import styles from './EmployeeSessionPage.module.css'

const EmployeeSessionPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, end, elapsedSeconds } = useWorkSession()

  const [ending, setEnding] = useState(false)

  if (!session) return ending ? null : <Navigate to="/funcionario/maquinas" replace />

  const endSession = () => {
    setEnding(true)
    end()
    navigate('/funcionario')
  }

  return (
    <section className={styles.page}>
      <video className={styles.illustration} autoPlay loop muted playsInline aria-hidden="true">
        <source src={forkliftWebm} type="video/webm" />
        <source src={forkliftMp4} type="video/mp4" />
      </video>
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

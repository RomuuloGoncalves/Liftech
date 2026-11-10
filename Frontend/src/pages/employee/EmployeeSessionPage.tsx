import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import ForkliftLoop from '../../components/common/ForkliftLoop'
import Spinner from '../../components/common/Spinner'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import { formatElapsed, useWorkSession } from '../../hooks/useWorkSession'
import styles from './EmployeeSessionPage.module.css'

const EmployeeSessionPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, ready, end, elapsedSeconds } = useWorkSession()

  const [ending, setEnding] = useState(false)

  if (!ready) return <EmployeeSkeleton variant="session" />

  if (!session) return ending ? null : <Navigate to="/funcionario/maquinas" replace />

  const endSession = async () => {
    if (ending) return
    setEnding(true)
    if (await end()) navigate('/funcionario')
    else setEnding(false)
  }

  return (
    <section className={styles.page}>
      <ForkliftLoop className={styles.illustration} />
      <p className={styles.description}>
        <Trans i18nKey="employee.session.description" components={{ b: <b /> }} />
      </p>
      <div className={styles.timer} role="timer" aria-label={t('employee.session.timerLabel')}>
        {formatElapsed(elapsedSeconds)}
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.button} ${styles.end}`}
          onClick={endSession}
          disabled={ending}
          aria-busy={ending}
        >
          {ending && <Spinner size={16} />}
          {ending ? t('employee.session.ending') : t('employee.session.end')}
          {!ending && <ArrowRight size={16} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.report}`}
          onClick={() => navigate('/funcionario/ocorrencia')}
          disabled={ending}
        >
          {t('employee.session.reportIncident')}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

export default EmployeeSessionPage

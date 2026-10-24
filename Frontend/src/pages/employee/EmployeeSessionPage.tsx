import React, { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import forkliftWebm from '../../assets/forklift.webm'
import forkliftMp4 from '../../assets/forklift.mp4'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import { formatElapsed, useWorkSession } from '../../hooks/useWorkSession'
import { loopFade } from '../../utils/loopFade'
import styles from './EmployeeSessionPage.module.css'

const EmployeeSessionPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { session, ready, end, elapsedSeconds } = useWorkSession()

  const [ending, setEnding] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    let frame = requestAnimationFrame(function tick() {
      video.style.opacity = String(loopFade(video.currentTime, video.duration))
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [session])

  if (!ready) return <EmployeeSkeleton variant="session" />

  if (!session) return ending ? null : <Navigate to="/funcionario/maquinas" replace />

  const endSession = async () => {
    setEnding(true)
    if (await end()) navigate('/funcionario')
    else setEnding(false)
  }

  return (
    <section className={styles.page}>
      <video ref={videoRef} className={styles.illustration} autoPlay loop muted playsInline aria-hidden="true">
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
        <button type="button" className={`${styles.button} ${styles.end}`} onClick={endSession} disabled={ending}>
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

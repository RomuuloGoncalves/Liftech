import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Timer } from 'lucide-react'
import { MACHINES } from '../../data/machines'
import { formatElapsed, useWorkSession } from '../../hooks/useWorkSession'
import styles from './SessionBar.module.css'

const SESSION_PATH = '/funcionario/sessao'

const SessionBar: React.FC = () => {
  const { t } = useTranslation()
  const { session, elapsedSeconds } = useWorkSession()
  const { pathname } = useLocation()
  if (!session || pathname.startsWith(SESSION_PATH)) return null

  const title = t('employee.sessionBar.title')
  const machine = MACHINES.find((m) => m.id === session.machineId)
  const elapsed = formatElapsed(elapsedSeconds)

  return (
    <Link
      to={SESSION_PATH}
      className={styles.bar}
      data-session-bar
      aria-label={`${title}${machine ? ` - ${machine.nome}` : ''} - ${elapsed}`}
    >
      <Timer size={20} aria-hidden="true" />
      <span className={styles.title}>{title}</span>
      {machine && <span className={styles.machine}>{machine.nome}</span>}
      <span className={styles.elapsed}>{elapsed}</span>
      <ChevronRight size={20} aria-hidden="true" />
    </Link>
  )
}

export default SessionBar

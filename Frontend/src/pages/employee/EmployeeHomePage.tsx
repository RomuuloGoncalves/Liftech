import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Forklift, History } from 'lucide-react'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import MachineListCard from '../../components/employee/MachineListCard'
import { filterAvailableMachines } from '../../data/employeeArea'
import { useEmployeeData } from '../../hooks/useEmployeeData'
import { formatAlertDate } from '../../utils/format'
import styles from './EmployeeHomePage.module.css'

const MAX_CARDS = 3

const DEFAULT_LAST_MACHINE = {
  maquina: {
    nome: 'Empilhadeira elétrica Tital-X',
    identificacao: 'EMP - 084(ID)',
  },
  date: '2026-09-05',
  durationLabel: '6 h 34m',
}

const EmployeeHomePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { machines, records, loading } = useEmployeeData()
  const available = filterAvailableMachines(machines, '').slice(0, MAX_CARDS)
  const lastSession = records.find((record): record is typeof record & { maquina: NonNullable<typeof record.maquina> } => record.maquina !== null)
  const last = lastSession ?? DEFAULT_LAST_MACHINE

  if (loading) {
    return (
      <div className={styles.page}>
        <EmployeeSkeleton variant="home" />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('employee.home.title')}</h1>
        <p className={styles.subtitle}>{t('employee.home.subtitle')}</p>
      </header>

      <section className={styles.last} aria-label={t('employee.home.lastMachine')}>
        <div className={styles.banner}>
          <History size={16} aria-hidden="true" />
          <span className={styles.bannerText}>{t('employee.home.lastMachine')}</span>
          <ArrowRight size={16} aria-hidden="true" />
        </div>
        <div className={styles.lastCard}>
          <div className={styles.lastMachineInfo}>
            <Forklift size={20} className={styles.forkliftIcon} aria-hidden="true" />
            <div className={styles.lastNames}>
              <p className={styles.lastName}>{last.maquina.nome}</p>
              <p className={styles.lastId}>{last.maquina.identificacao}</p>
            </div>
          </div>
          <div className={styles.lastMeta}>
            <p className={styles.lastDate}>{formatAlertDate(last.date, i18n.language)}</p>
            <p className={styles.lastTime}>
              {last.durationLabel && <span className={styles.lastDuration}>{last.durationLabel} | </span>}
              <span>{t('employee.home.totalTime')}</span>
            </p>
          </div>
        </div>
      </section>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <h2 className={styles.statLabel}>{t('employee.home.workday')}</h2>
          <p className={styles.statValue}>{t('employee.home.workdaySchedule')}</p>
          <p className={styles.statHint}>{t('employee.home.workdayDaily')}</p>
        </div>
        <div className={styles.stat}>
          <h2 className={styles.statLabel}>{t('employee.home.remaining')}</h2>
          <div className={styles.countdown} role="timer" aria-label={t('employee.home.remainingValue')}>
            <span className={styles.digitBox} aria-hidden="true">0</span>
            <span className={styles.digitBox} aria-hidden="true">4</span>
            <span className={styles.digitColon} aria-hidden="true">:</span>
            <span className={styles.digitBox} aria-hidden="true">0</span>
            <span className={styles.digitBox} aria-hidden="true">0</span>
            <span className={styles.srOnly}>{t('employee.home.remainingValue')}</span>
          </div>
        </div>
      </div>

      <section className={styles.available}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>{t('employee.home.availableTitle')}</h2>
          <Link to="/funcionario/maquinas" className={styles.more}>
            {t('employee.home.more')}
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className={styles.list}>
          {available.map((machine) => (
            <MachineListCard
              key={machine.id}
              machine={machine}
              actionLabel={t('employee.machines.select')}
              onAction={() => navigate(`/funcionario/maquinas/${machine.id}`)}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

export default EmployeeHomePage

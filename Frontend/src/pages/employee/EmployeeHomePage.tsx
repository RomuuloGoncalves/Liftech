import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import { useFirstVisitLoading } from '../../hooks/useFirstVisitLoading'
import MachineListCard from '../../components/employee/MachineListCard'
import { LAST_MACHINE_USAGE, filterAvailableMachines } from '../../data/employeeArea'
import { MACHINES } from '../../data/machines'
import { formatAlertDate } from '../../utils/format'
import styles from './EmployeeHomePage.module.css'

const MAX_CARDS = 3

const EmployeeHomePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const loading = useFirstVisitLoading('employee-home')
  const available = filterAvailableMachines(MACHINES, '').slice(0, MAX_CARDS)

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
          <Clock size={14} aria-hidden="true" />
          <span className={styles.bannerText}>{t('employee.home.lastMachine')}</span>
          <ArrowRight size={14} aria-hidden="true" />
        </div>
        <div className={styles.lastCard}>
          <div className={styles.lastNames}>
            <p className={styles.lastName}>{LAST_MACHINE_USAGE.nome}</p>
            <p className={styles.lastId}>{LAST_MACHINE_USAGE.identificacao}</p>
          </div>
          <div className={styles.lastMeta}>
            <p className={styles.lastDate}>{formatAlertDate(LAST_MACHINE_USAGE.date, i18n.language)}</p>
            <p className={styles.lastId}>{t('employee.home.totalTime')}</p>
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
          <p className={styles.statBig}>{t('employee.home.remainingValue')}</p>
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

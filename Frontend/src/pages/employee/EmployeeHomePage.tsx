import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Clock } from 'lucide-react'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import { useFirstVisitLoading } from '../../hooks/useFirstVisitLoading'
import MachineListCard from '../../components/employee/MachineListCard'
import { filterAvailableMachines } from '../../data/employeeArea'
import { useEmployeeData } from '../../hooks/useEmployeeData'
import { formatAlertDate } from '../../utils/format'
import styles from './EmployeeHomePage.module.css'

const MAX_CARDS = 3

const EmployeeHomePage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const loading = useFirstVisitLoading('employee-home')
  const { machines, records } = useEmployeeData()
  const available = filterAvailableMachines(machines, '').slice(0, MAX_CARDS)
  const last = records.find((record) => record.maquina)

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

      {last?.maquina && (
        <section className={styles.last} aria-label={t('employee.home.lastMachine')}>
          <div className={styles.banner}>
            <Clock size={14} aria-hidden="true" />
            <span className={styles.bannerText}>{t('employee.home.lastMachine')}</span>
            <ArrowRight size={14} aria-hidden="true" />
          </div>
          <div className={styles.lastCard}>
            <div className={styles.lastNames}>
              <p className={styles.lastName}>{last.maquina.nome}</p>
              <p className={styles.lastId}>{last.maquina.identificacao}</p>
            </div>
            <div className={styles.lastMeta}>
              <p className={styles.lastDate}>{formatAlertDate(last.date, i18n.language)}</p>
              <p className={styles.lastId}>{t('employee.home.totalTime')}</p>
            </div>
          </div>
        </section>
      )}

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

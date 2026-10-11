import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock, Search } from 'lucide-react'
import MachineListCard from '../../components/employee/MachineListCard'
import { MACHINES } from '../../data/machines'
import { USAGE_HISTORY, filterUsageHistory } from '../../data/employeeArea'
import styles from './EmployeeHistoryPage.module.css'

const EmployeeHistoryPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [machineQuery, setMachineQuery] = useState('')

  const records = filterUsageHistory(USAGE_HISTORY, { from, to, startTime, endTime, machineQuery })
  const formatDate = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString(i18n.language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    })

  return (
    <section className={styles.page}>
      <h1 className={styles.title}>{t('employee.history.title')}</h1>
      <p className={styles.subtitle}>{t('employee.history.subtitle')}</p>

      <h2 className={styles.filtersTitle}>{t('employee.history.filters')}</h2>
      <div className={styles.filters}>
        <div className={`${styles.field} ${styles.period}`}>
          <CalendarDays size={16} aria-hidden="true" />
          <input
            type="date"
            className={styles.input}
            aria-label={t('employee.history.periodFrom')}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span aria-hidden="true">-</span>
          <input
            type="date"
            className={styles.input}
            aria-label={t('employee.history.periodTo')}
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className={styles.times}>
          <label className={styles.field}>
            <Clock size={16} aria-hidden="true" />
            <input
              type="time"
              className={styles.input}
              aria-label={t('employee.history.startTime')}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <Clock size={16} aria-hidden="true" />
            <input
              type="time"
              className={styles.input}
              aria-label={t('employee.history.endTime')}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>
        </div>
        <label className={styles.field}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            className={styles.input}
            placeholder={t('employee.history.searchPlaceholder')}
            aria-label={t('employee.history.searchPlaceholder')}
            value={machineQuery}
            onChange={(e) => setMachineQuery(e.target.value)}
          />
        </label>
      </div>

      {records.length === 0 ? (
        <p className={styles.empty}>{t('employee.history.empty')}</p>
      ) : (
        <div className={styles.list}>
          {records.map((record) => {
            const machine = MACHINES.find((item) => item.id === record.machineId)
            if (!machine) return null
            return (
              <MachineListCard
                key={record.id}
                machine={machine}
                extra={{ date: formatDate(record.date), time: record.start }}
                actionLabel={t('employee.history.moreDetails')}
                onAction={() => navigate(`/funcionario/maquinas/${machine.id}`)}
              />
            )
          })}
        </div>
      )}
    </section>
  )
}

export default EmployeeHistoryPage

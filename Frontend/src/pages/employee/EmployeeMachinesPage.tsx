import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import MachineListCard from '../../components/employee/MachineListCard'
import MachineDetailSheet from '../../components/employee/MachineDetailSheet'
import { MACHINES } from '../../data/machines'
import { USAGE_HISTORY, filterAvailableMachines } from '../../data/employeeArea'
import styles from './EmployeeMachinesPage.module.css'

const FALLBACK_USAGE = { date: '2025-09-14', time: '14:35' }

const EmployeeMachinesPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [query, setQuery] = useState('')

  const machines = useMemo(() => filterAvailableMachines(MACHINES, query), [query])
  const selected = id ? MACHINES.find((machine) => machine.id === id) : undefined

  const extraFor = (machineId: string) => {
    const record = USAGE_HISTORY.find((item) => item.machineId === machineId)
    const date = record?.date ?? FALLBACK_USAGE.date
    return {
      date: new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language),
      time: record?.start.slice(0, 5) ?? FALLBACK_USAGE.time,
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('employee.machines.title')}</h1>
        <p className={styles.subtitle}>{t('employee.machines.subtitle')}</p>
      </header>

      <label className={styles.search}>
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          className={styles.searchInput}
          aria-label={t('employee.machines.searchLabel')}
          placeholder={t('employee.machines.searchPlaceholder')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      {machines.length === 0 ? (
        <p className={styles.empty}>{t('employee.machines.empty')}</p>
      ) : (
        <div className={styles.list}>
          {machines.map((machine) => (
            <MachineListCard
              key={machine.id}
              machine={machine}
              extra={extraFor(machine.id)}
              actionLabel={t('employee.machines.select')}
              onAction={() => navigate(`/funcionario/maquinas/${machine.id}`)}
            />
          ))}
        </div>
      )}

      {selected && <MachineDetailSheet machine={selected} onClose={() => navigate('/funcionario/maquinas')} />}
    </div>
  )
}

export default EmployeeMachinesPage

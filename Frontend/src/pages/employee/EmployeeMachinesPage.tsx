import React, { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import { useFirstVisitLoading } from '../../hooks/useFirstVisitLoading'
import MachineListCard from '../../components/employee/MachineListCard'
import MachineDetailSheet from '../../components/employee/MachineDetailSheet'
import { filterAvailableMachines } from '../../data/employeeArea'
import { useEmployeeData } from '../../hooks/useEmployeeData'
import styles from './EmployeeMachinesPage.module.css'

const EmployeeMachinesPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams()
  const [query, setQuery] = useState('')
  const loading = useFirstVisitLoading('employee-machines')

  const { machines: all, records } = useEmployeeData()
  const machines = useMemo(() => filterAvailableMachines(all, query), [all, query])
  const selected = id ? all.find((machine) => machine.id === id) : undefined

  const extraFor = (machineId: string) => {
    const record = records.find((item) => item.machineId === machineId)
    return (
      record && {
        date: new Date(`${record.date}T12:00:00`).toLocaleDateString(i18n.language),
        time: record.start.slice(0, 5),
      }
    )
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <EmployeeSkeleton variant="list" />
      </div>
    )
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

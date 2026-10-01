import React, { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import EmployeeCard from '../components/team/EmployeeCard'
import { ACCESS_VALUES, EMPLOYEES, filterEmployees, type Access, type Employee } from '../data/team'
import styles from './EquipePage.module.css'

type AccessFilter = Access | 'Todos'

const EquipePage: React.FC = () => {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES)
  const [employeeQuery, setEmployeeQuery] = useState('')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('Todos')

  const visibleEmployees = useMemo(
    () => filterEmployees(employees, { query: employeeQuery, access: accessFilter }),
    [employees, employeeQuery, accessFilter]
  )

  const toggleAccess = (employee: Employee) =>
    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, acesso: e.acesso === 'Permitido' ? 'Negado' : 'Permitido' } : e))
    )

  return (
    <div className={styles.page}>
      <section className={styles.section} aria-labelledby="team-employees-title">
        <div className={styles.sectionHeader}>
          <h2 id="team-employees-title" className={styles.sectionTitle}>
            {t('team.employees')}
          </h2>
          <div className={styles.toolbar}>
            <div className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder={t('team.searchPlaceholder')}
                aria-label={`${t('team.employees')}: ${t('common.search')}`}
                value={employeeQuery}
                onChange={(event) => setEmployeeQuery(event.target.value)}
              />
            </div>
            <select
              className={styles.select}
              aria-label={t('team.accessFilterLabel')}
              value={accessFilter}
              onChange={(event) => setAccessFilter(event.target.value as AccessFilter)}
            >
              <option value="Todos">{t('team.accessAll')}</option>
              {ACCESS_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value === 'Permitido' ? t('team.accessAllowed') : t('team.accessDenied')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {visibleEmployees.length === 0 ? (
          <p className={styles.emptyState}>{t('team.emptyEmployees')}</p>
        ) : (
          <div className={styles.grid}>
            {visibleEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onOpen={() => {}}
                onToggleAccess={toggleAccess}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default EquipePage

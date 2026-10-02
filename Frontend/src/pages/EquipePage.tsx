import React, { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmployeeCard from '../components/team/EmployeeCard'
import EmployeeFormModal, { type EmployeeFormValues } from '../components/team/EmployeeFormModal'
import EmployeeInfoModal from '../components/team/EmployeeInfoModal'
import SectorCard from '../components/team/SectorCard'
import SectorFormModal, { type SectorFormValues } from '../components/team/SectorFormModal'
import SectorInfoModal from '../components/team/SectorInfoModal'
import {
  ACCESS_VALUES,
  EMPLOYEES,
  SECTORS,
  filterEmployees,
  filterSectors,
  nextEmployeeCode,
  type Access,
  type Employee,
  type Sector,
} from '../data/team'
import PageSkeleton from '../components/common/PageSkeleton'
import { useToast } from '../components/common/Toast'
import { useFirstVisitLoading } from '../hooks/useFirstVisitLoading'
import styles from './EquipePage.module.css'

type AccessFilter = Access | 'Todos'

type Dialog =
  | { kind: 'employeeForm'; employee?: Employee }
  | { kind: 'employeeInfo'; employee: Employee }
  | { kind: 'sectorForm'; sector?: Sector }
  | { kind: 'sectorInfo'; sector: Sector }
  | { kind: 'confirmDelete'; target: { type: 'employee'; item: Employee } | { type: 'sector'; item: Sector } }

let nextEmployeeId = EMPLOYEES.length + 1
let nextSectorId = SECTORS.length + 1

const EquipePage: React.FC = () => {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState<Employee[]>(EMPLOYEES)
  const [employeeQuery, setEmployeeQuery] = useState('')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('Todos')
  const [sectors, setSectors] = useState<Sector[]>(SECTORS)
  const [sectorQuery, setSectorQuery] = useState('')
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const loading = useFirstVisitLoading('equipe')
  const { show } = useToast()

  const visibleEmployees = useMemo(
    () => filterEmployees(employees, { query: employeeQuery, access: accessFilter }),
    [employees, employeeQuery, accessFilter]
  )

  const visibleSectors = useMemo(() => filterSectors(sectors, { query: sectorQuery }), [sectors, sectorQuery])

  const toggleAccess = (employee: Employee) =>
    setEmployees((prev) =>
      prev.map((e) => (e.id === employee.id ? { ...e, acesso: e.acesso === 'Permitido' ? 'Negado' : 'Permitido' } : e))
    )

  const saveEmployee = (values: EmployeeFormValues) => {
    if (dialog?.kind === 'employeeForm' && dialog.employee) {
      const id = dialog.employee.id
      setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...values } : e)))
      show(t('team.toastEmployeeSaved', { name: values.nome }))
    } else {
      const created: Employee = {
        ...values,
        id: String(nextEmployeeId++),
        matricula: nextEmployeeCode(employees),
        acesso: 'Permitido',
      }
      setEmployees((prev) => [created, ...prev])
      show(t('team.toastEmployeeCreated', { name: values.nome }))
    }
    setDialog(null)
  }

  const saveSector = (values: SectorFormValues) => {
    if (dialog?.kind === 'sectorForm' && dialog.sector) {
      const id = dialog.sector.id
      setSectors((prev) => prev.map((sector) => (sector.id === id ? { ...sector, ...values } : sector)))
      show(t('team.toastSectorSaved', { name: values.nome }))
    } else {
      setSectors((prev) => [{ ...values, id: String(nextSectorId++) }, ...prev])
      show(t('team.toastSectorCreated', { name: values.nome }))
    }
    setDialog(null)
  }

  const deleteConfirmed = () => {
    if (dialog?.kind !== 'confirmDelete') return
    const { type, item } = dialog.target
    if (type === 'employee') {
      setEmployees((prev) => prev.filter((e) => e.id !== item.id))
      show(t('team.toastEmployeeDeleted', { name: item.nome }))
    } else {
      setSectors((prev) => prev.filter((sector) => sector.id !== item.id))
      show(t('team.toastSectorDeleted', { name: item.nome }))
    }
    setDialog(null)
  }

  const closeDialog = () => setDialog(null)

  if (loading) {
    return (
      <div className={styles.page}>
        <PageSkeleton variant="team" gridClassName={styles.grid} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.section} aria-labelledby="team-employees-title">
        <div className={styles.sectionHeader}>
          <h2 id="team-employees-title" className={styles.sectionTitle}>
            {t('team.employees')}
          </h2>
          <div className={styles.toolbar}>
            <button type="button" className={styles.registerButton} onClick={() => setDialog({ kind: 'employeeForm' })}>
              <Plus size={16} />
              {t('team.registerEmployee')}
            </button>
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
                onOpen={(e) => setDialog({ kind: 'employeeInfo', employee: e })}
                onToggleAccess={toggleAccess}
                onEdit={(e) => setDialog({ kind: 'employeeForm', employee: e })}
                onDelete={(e) => setDialog({ kind: 'confirmDelete', target: { type: 'employee', item: e } })}
              />
            ))}
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="team-sectors-title">
        <div className={styles.sectionHeader}>
          <h2 id="team-sectors-title" className={styles.sectionTitle}>
            {t('team.sectors')}
          </h2>
          <div className={styles.toolbar}>
            <button type="button" className={styles.registerButton} onClick={() => setDialog({ kind: 'sectorForm' })}>
              <Plus size={16} />
              {t('team.registerSector')}
            </button>
            <div className={styles.searchField}>
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder={t('team.searchPlaceholder')}
                aria-label={`${t('team.sectors')}: ${t('common.search')}`}
                value={sectorQuery}
                onChange={(event) => setSectorQuery(event.target.value)}
              />
            </div>
          </div>
        </div>

        {visibleSectors.length === 0 ? (
          <p className={styles.emptyState}>{t('team.emptySectors')}</p>
        ) : (
          <div className={styles.grid}>
            {visibleSectors.map((sector) => (
              <SectorCard
                key={sector.id}
                sector={sector}
                onOpen={(item) => setDialog({ kind: 'sectorInfo', sector: item })}
                onEdit={(item) => setDialog({ kind: 'sectorForm', sector: item })}
                onDelete={(item) => setDialog({ kind: 'confirmDelete', target: { type: 'sector', item } })}
              />
            ))}
          </div>
        )}
      </section>

      {dialog?.kind === 'employeeForm' && (
        <EmployeeFormModal employee={dialog.employee} existing={employees} onSave={saveEmployee} onClose={closeDialog} />
      )}
      {dialog?.kind === 'employeeInfo' && <EmployeeInfoModal employee={dialog.employee} onClose={closeDialog} />}
      {dialog?.kind === 'sectorForm' && (
        <SectorFormModal sector={dialog.sector} onSave={saveSector} onClose={closeDialog} />
      )}
      {dialog?.kind === 'sectorInfo' && <SectorInfoModal sector={dialog.sector} onClose={closeDialog} />}
      {dialog?.kind === 'confirmDelete' && (
        <ConfirmDialog
          title={dialog.target.type === 'employee' ? t('team.deleteEmployeeTitle') : t('team.deleteSectorTitle')}
          message={t('team.deleteMessage', { name: dialog.target.item.nome })}
          onConfirm={deleteConfirmed}
          onCancel={closeDialog}
        />
      )}
    </div>
  )
}

export default EquipePage

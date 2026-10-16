import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
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
  filterEmployees,
  filterSectors,
  type Access,
  type Employee,
  type Sector,
} from '../data/team'
import PageSkeleton, { SkeletonBlock, SkeletonCards } from '../components/common/PageSkeleton'
import { useToast } from '../components/common/Toast'
import { useActiveBranch } from '../context/ActiveBranchContext'
import { operatorService } from '../services/operatorService'
import { sectorService } from '../services/sectorService'
import styles from './EquipePage.module.css'

type AccessFilter = Access | 'Todos'
type LoadState = 'loading' | 'ready' | 'error'

type Dialog =
  | { kind: 'employeeForm'; employee?: Employee }
  | { kind: 'employeeInfo'; employee: Employee }
  | { kind: 'sectorForm'; sector?: Sector }
  | { kind: 'sectorInfo'; sector: Sector }
  | { kind: 'confirmDelete'; target: { type: 'employee'; item: Employee } | { type: 'sector'; item: Sector } }

let nextTempSector = 1

const EquipePage: React.FC = () => {
  const { t } = useTranslation()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeQuery, setEmployeeQuery] = useState('')
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('Todos')
  const [sectors, setSectors] = useState<Sector[]>([])
  const [sectorQuery, setSectorQuery] = useState('')
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const { show, showError } = useToast()
  const { activeBranch, branches, canManage } = useActiveBranch()
  const filialId = activeBranch === 'todas' ? undefined : activeBranch
  const [loadedFilialId, setLoadedFilialId] = useState(filialId)
  const [attempt, setAttempt] = useState(0)

  // A different active branch goes back to the skeleton before the effect refetches.
  if (loadedFilialId !== filialId) {
    setLoadedFilialId(filialId)
    setLoadState('loading')
  }

  useEffect(() => {
    let stale = false
    Promise.all([operatorService.listar(filialId), sectorService.listar(filialId)]).then(
      ([employeeList, sectorList]) => {
        if (stale) return
        setEmployees(employeeList)
        setSectors(sectorList)
        setLoadState('ready')
      },
      () => {
        if (!stale) setLoadState('error')
      }
    )
    return () => {
      stale = true
    }
  }, [filialId, attempt])

  const retry = () => {
    setLoadState('loading')
    setAttempt((value) => value + 1)
  }

  const visibleEmployees = useMemo(
    () => filterEmployees(employees, { query: employeeQuery, access: accessFilter }),
    [employees, employeeQuery, accessFilter]
  )

  const visibleSectors = useMemo(() => filterSectors(sectors, { query: sectorQuery }), [sectors, sectorQuery])

  const replaceEmployee = (employee: Employee) =>
    setEmployees((prev) => prev.map((e) => (e.id === employee.id ? employee : e)))

  // Optimistic: shows `next`, saves, then uses the API answer; on failure puts `previous` back.
  const saveOptimistic = (previous: Employee, next: Employee, save: () => Promise<Employee>, errorKey = 'team.saveError') => {
    replaceEmployee(next)
    save().then(replaceEmployee, (e) => {
      replaceEmployee(previous)
      showError(t(axios.isAxiosError(e) && e.response?.status === 409 ? errorKey : 'team.saveError'))
    })
  }

  const toggleAccess = (employee: Employee) => {
    const denying = employee.acesso === 'Permitido'
    saveOptimistic(employee, { ...employee, acesso: denying ? 'Negado' : 'Permitido' }, () =>
      operatorService.atualizarLogin(employee.id, { acessoNegado: denying })
    )
  }

  // Create waits for the API: the operator first, then its login. A refused login keeps the employee without one.
  // ponytail: no in-flight guard, a double click on Confirmar registers twice; disable the button if it shows up.
  const createEmployee = async (values: EmployeeFormValues) => {
    let created: Employee
    try {
      created = await operatorService.criar(values, values.filialId ?? filialId)
    } catch {
      showError(t('team.saveError'))
      return
    }
    try {
      const withLogin = await operatorService.criarLogin(created.id, values.usuario, values.senha)
      setEmployees((prev) => [withLogin, ...prev])
      show(t('team.toastEmployeeCreated', { name: withLogin.nome }))
      setDialog(null)
    } catch (e) {
      setEmployees((prev) => [created, ...prev])
      if (axios.isAxiosError(e) && e.response?.status === 409) {
        // The operator exists now: the open form turns into its edit, so Confirmar only creates the login.
        showError(t('team.usernameTaken'))
        setDialog({ kind: 'employeeForm', employee: created })
      } else {
        showError(t('team.loginError'))
        setDialog(null)
      }
    }
  }

  const editEmployee = (employee: Employee, values: EmployeeFormValues) => {
    const createsLogin = employee.usuario === null && values.usuario !== ''
    const edited: Employee = {
      ...employee,
      nome: values.nome,
      telefone: values.telefone,
      cargo: values.cargo,
      horarioEntrada: values.horarioEntrada,
      horarioSaida: values.horarioSaida,
      ...(createsLogin && { usuario: values.usuario, acesso: 'Permitido' }),
    }
    const save = async () => {
      const saved = await operatorService.atualizar(employee.id, values)
      if (createsLogin) return operatorService.criarLogin(employee.id, values.usuario, values.senha)
      if (employee.usuario !== null && values.senha !== '') return operatorService.atualizarLogin(employee.id, { senha: values.senha })
      return saved
    }
    saveOptimistic(employee, edited, save, 'team.usernameTaken')
    show(t('team.toastEmployeeSaved', { name: values.nome }))
    setDialog(null)
  }

  const saveEmployee = (values: EmployeeFormValues) => {
    if (dialog?.kind !== 'employeeForm') return
    if (dialog.employee) editEmployee(dialog.employee, values)
    else void createEmployee(values)
  }

  const replaceSector = (id: string, sector: Sector) =>
    setSectors((prev) => prev.map((s) => (s._id === id ? sector : s)))

  // The 409 with a machine count names it; any other 409 is the repeated name.
  const sectorError = (e: unknown, machinesKey: string) => {
    if (!axios.isAxiosError(e) || e.response?.status !== 409) return t('team.saveError')
    const n = /Setor com (\d+)/.exec(String(e.response.data?.error ?? ''))?.[1]
    return n ? t(machinesKey, { n }) : t('team.sectorNameTaken')
  }

  const saveSector = (values: SectorFormValues) => {
    if (dialog?.kind !== 'sectorForm') return
    const filial = { nome: branches.find((b) => b._id === values.filialId)?.nome ?? '' }
    const previous = dialog.sector
    if (previous) {
      replaceSector(previous._id, { ...previous, ...values, filial })
      // Only the company scope may move a sector; the others keep it where it is.
      sectorService
        .atualizar(previous._id, canManage ? values : { nome: values.nome })
        .then((saved) => replaceSector(previous._id, saved), (e) => {
          replaceSector(previous._id, previous)
          showError(sectorError(e, 'team.sectorMoveHasMachines'))
        })
      show(t('team.toastSectorSaved', { name: values.nome }))
    } else {
      const tempId = `temp-${nextTempSector++}`
      setSectors((prev) => [{ ...values, filial, _id: tempId }, ...prev])
      sectorService
        .criar({ nome: values.nome, filialId: values.filialId || undefined })
        .then((saved) => replaceSector(tempId, saved), (e) => {
          setSectors((prev) => prev.filter((s) => s._id !== tempId))
          showError(sectorError(e, 'team.sectorHasMachines'))
        })
      show(t('team.toastSectorCreated', { name: values.nome }))
    }
    setDialog(null)
  }

  const deleteConfirmed = () => {
    if (dialog?.kind !== 'confirmDelete') return
    const { type, item } = dialog.target
    if (type === 'employee') {
      const index = employees.indexOf(item)
      setEmployees((prev) => prev.filter((e) => e.id !== item.id))
      show(t('team.toastEmployeeDeleted', { name: item.nome }))
      operatorService.remover(item.id).catch((e) => {
        setEmployees((prev) => [...prev.slice(0, index), item, ...prev.slice(index)])
        showError(t(axios.isAxiosError(e) && e.response?.status === 409 ? 'team.deleteInSession' : 'team.saveError'))
      })
    } else {
      const index = sectors.indexOf(item)
      setSectors((prev) => prev.filter((sector) => sector._id !== item._id))
      show(t('team.toastSectorDeleted', { name: item.nome }))
      sectorService.remover(item._id).catch((e) => {
        setSectors((prev) => [...prev.slice(0, index), item, ...prev.slice(index)])
        showError(sectorError(e, 'team.sectorHasMachines'))
      })
    }
    setDialog(null)
  }

  const closeDialog = () => setDialog(null)

  if (loadState === 'loading') {
    return (
      <div className={styles.page}>
        <PageSkeleton>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <SkeletonBlock className={styles.titleSkeleton} />
              <div className={styles.toolbar}>
                <SkeletonBlock className={styles.employeeButtonSkeleton} />
                <SkeletonBlock className={styles.searchSkeleton} />
                <SkeletonBlock className={styles.selectSkeleton} />
              </div>
            </div>
            <SkeletonCards card="employee" className={styles.grid} />
          </div>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <SkeletonBlock className={styles.titleSkeleton} />
              <div className={styles.toolbar}>
                <SkeletonBlock className={styles.sectorButtonSkeleton} />
                <SkeletonBlock className={styles.searchSkeleton} />
              </div>
            </div>
            <SkeletonCards card="sector" className={styles.grid} />
          </div>
        </PageSkeleton>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className={styles.page}>
        <div role="alert" className={styles.errorState}>
          <p>{t('team.loadError')}</p>
          <button type="button" className={styles.registerButton} onClick={retry}>
            {t('common.retry')}
          </button>
        </div>
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
                key={sector._id}
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
        <EmployeeFormModal
          employee={dialog.employee}
          existing={employees}
          branches={!dialog.employee && activeBranch === 'todas' ? branches : undefined}
          onSave={saveEmployee}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'employeeInfo' && <EmployeeInfoModal employee={dialog.employee} onClose={closeDialog} />}
      {dialog?.kind === 'sectorForm' && (
        <SectorFormModal
          sector={dialog.sector}
          branches={branches}
          canMove={canManage}
          defaultFilialId={filialId}
          onSave={saveSector}
          onClose={closeDialog}
        />
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

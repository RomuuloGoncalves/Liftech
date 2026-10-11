import React, { useId, useState } from 'react'
import { ArrowRight, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../common/Toast'
import { EMPLOYEE_NAME } from '../../data/employeeArea'
import { MACHINES } from '../../data/machines'
import { useFirstVisitLoading } from '../../hooks/useFirstVisitLoading'
import { useWorkSession } from '../../hooks/useWorkSession'
import BottomSheet from './BottomSheet'
import EmployeeSkeleton from './EmployeeSkeleton'
import styles from './IncidentSheet.module.css'

interface IncidentSheetProps {
  open: boolean
  onClose: () => void
  onSubmitted?: () => void
}

type FieldName = 'name' | 'sector' | 'machine' | 'time'
type Values = Record<FieldName, string>

const FIELDS: FieldName[] = ['name', 'sector', 'machine', 'time']

const IncidentForm: React.FC<{ formId: string; onSubmitted: () => void }> = ({ formId, onSubmitted }) => {
  const { t } = useTranslation()
  const { session } = useWorkSession()
  const baseId = useId()
  const [values, setValues] = useState<Values>(() => {
    const machine = session ? MACHINES.find((item) => item.id === session.machineId) : undefined
    return { name: EMPLOYEE_NAME, sector: machine?.setor ?? '', machine: machine?.nome ?? '', time: '' }
  })
  const [invalid, setInvalid] = useState<FieldName[]>([])

  const labels: Record<FieldName, string> = {
    name: t('employee.incident.employeeName'),
    sector: t('employee.incident.sector'),
    machine: t('employee.incident.machine'),
    time: t('employee.incident.time'),
  }
  const placeholders: Partial<Record<FieldName, string>> = {
    name: t('employee.incident.employeeNamePlaceholder'),
    sector: t('employee.incident.sectorPlaceholder'),
    machine: t('employee.incident.machinePlaceholder'),
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const missing = FIELDS.filter((field) => values[field].trim() === '')
    setInvalid(missing)
    if (missing.length === 0) onSubmitted()
  }

  return (
    <form id={formId} className={styles.form} onSubmit={handleSubmit} noValidate>
      {FIELDS.map((field) => {
        const isInvalid = invalid.includes(field)
        const inputId = `${baseId}-${field}`
        const errorId = `${inputId}-error`
        return (
          <div key={field} className={field === 'time' ? `${styles.field} ${styles.timeField}` : styles.field}>
            <label htmlFor={inputId} className={styles.label}>
              {labels[field]}
            </label>
            <div className={styles.inputWrap}>
              {field === 'time' && <Clock size={16} aria-hidden="true" className={styles.icon} />}
              <input
                id={inputId}
                type={field === 'time' ? 'time' : 'text'}
                className={field === 'time' ? `${styles.input} ${styles.timeInput}` : styles.input}
                value={values[field]}
                placeholder={placeholders[field]}
                aria-invalid={isInvalid}
                aria-describedby={isInvalid ? errorId : undefined}
                onChange={(event) => {
                  setValues((prev) => ({ ...prev, [field]: event.target.value }))
                  setInvalid((prev) => prev.filter((item) => item !== field))
                }}
              />
            </div>
            {isInvalid && (
              <span id={errorId} className={styles.error}>
                {t('employee.incident.required')}
              </span>
            )}
          </div>
        )
      })}
    </form>
  )
}

const IncidentBody: React.FC<{ formId: string; onSubmitted: () => void }> = (props) => {
  const loading = useFirstVisitLoading('employee-incident')
  return loading ? <EmployeeSkeleton variant="form" buttons={false} /> : <IncidentForm {...props} />
}

const IncidentSheet: React.FC<IncidentSheetProps> = ({ open, onClose, onSubmitted }) => {
  const { t } = useTranslation()
  const { show } = useToast()
  const formId = useId()

  const handleSubmitted = () => {
    show(t('employee.incident.toastSent'))
    onSubmitted?.()
    onClose()
  }

  return (
    <BottomSheet
      open={open}
      title={t('employee.incident.title')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={`${styles.button} ${styles.cancel}`} onClick={onClose}>
            {t('employee.incident.cancel')}
          </button>
          <button type="submit" form={formId} className={`${styles.button} ${styles.submit}`}>
            {t('employee.incident.submit')}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </>
      }
    >
      <IncidentBody formId={formId} onSubmitted={handleSubmitted} />
    </BottomSheet>
  )
}

export default IncidentSheet

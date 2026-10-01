import React, { useId, useState } from 'react'
import { Clock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import buttons from '../common/DialogButtons.module.css'
import { isUsernameTaken, type Employee } from '../../data/team'
import styles from './TeamForm.module.css'

export interface EmployeeFormValues {
  nome: string
  telefone: string
  cargo: string
  horarioEntrada: string
  horarioSaida: string
  usuario: string
  senha: string
}

interface EmployeeFormModalProps {
  employee?: Employee
  existing: Employee[]
  onSave: (values: EmployeeFormValues) => void
  onClose: () => void
}

type Errors = Partial<Record<keyof EmployeeFormValues, string>>

const REQUIRED_FIELDS: (keyof EmployeeFormValues)[] = ['nome', 'cargo', 'usuario', 'senha']

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ employee, existing, onSave, onClose }) => {
  const { t } = useTranslation()
  const uid = useId()
  const [values, setValues] = useState<EmployeeFormValues>({
    nome: employee?.nome ?? '',
    telefone: employee?.telefone ?? '',
    cargo: employee?.cargo ?? '',
    horarioEntrada: employee?.horarioEntrada ?? '',
    horarioSaida: employee?.horarioSaida ?? '',
    usuario: employee?.usuario ?? '',
    senha: employee?.senha ?? '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)

  const update = (field: keyof EmployeeFormValues) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    for (const field of REQUIRED_FIELDS) {
      if (values[field].trim() === '') next[field] = t('team.required')
    }
    if (!next.usuario && isUsernameTaken(existing, values.usuario, employee?.id)) {
      next.usuario = t('team.usernameTaken')
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    onSave({
      ...values,
      nome: values.nome.trim(),
      cargo: values.cargo.trim(),
      usuario: values.usuario.trim(),
      telefone: values.telefone.trim(),
    })
  }

  const field = (
    name: keyof EmployeeFormValues,
    label: string,
    placeholder: string,
    options: { type?: string; icon?: 'clock' | 'password' } = {}
  ) => {
    const id = `${uid}-${name}`
    const error = errors[name]
    const isPassword = options.icon === 'password'
    const type = isPassword ? (showPassword ? 'text' : 'password') : (options.type ?? 'text')
    const inputClass = [
      styles.input,
      options.icon === 'clock' ? styles.withLeftIcon : '',
      isPassword ? styles.withRightIcon : '',
      error ? styles.invalid : '',
    ].join(' ')

    return (
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <div className={styles.inputWrap}>
          {options.icon === 'clock' && <Clock size={14} className={styles.leftIcon} aria-hidden="true" />}
          <input
            id={id}
            type={type}
            className={inputClass}
            placeholder={placeholder}
            value={values[name]}
            onChange={update(name)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            autoComplete="off"
          />
          {isPassword && (
            <button
              type="button"
              className={styles.rightButton}
              aria-label={showPassword ? t('team.hidePassword') : t('team.showPassword')}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <span id={`${id}-error`} className={styles.error}>
            {error}
          </span>
        )}
      </div>
    )
  }

  return (
    <Modal title={employee ? t('team.editEmployeeTitle') : t('team.newEmployeeTitle')} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {field('nome', t('team.labelEmployeeName'), t('team.phEmployeeName'))}
        {field('telefone', t('team.labelPhone'), t('team.phPhone'), { type: 'tel' })}
        {field('cargo', t('team.labelRole'), t('team.phRole'))}
        <div className={styles.row}>
          {field('horarioEntrada', t('team.labelEntry'), '', { type: 'time', icon: 'clock' })}
          {field('horarioSaida', t('team.labelExit'), '', { type: 'time', icon: 'clock' })}
        </div>
        <div className={styles.divider} />
        {field('usuario', t('team.labelUsername'), t('team.phUsername'))}
        {field('senha', t('team.labelPassword'), t('team.phPassword'), { icon: 'password' })}
        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={buttons.confirm}>
            {t('team.confirm')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EmployeeFormModal

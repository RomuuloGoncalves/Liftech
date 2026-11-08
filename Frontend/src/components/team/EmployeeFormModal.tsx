import React, { useId, useState } from 'react'
import { Clock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import Select from '../common/Select'
import Spinner from '../common/Spinner'
import buttons from '../common/DialogButtons.module.css'
import { isUsernameTaken, type Employee } from '../../data/team'
import type { Filial } from '../../services/authService'
import styles from './TeamForm.module.css'

export interface EmployeeFormValues {
  nome: string
  telefone: string
  cargo: string
  horarioEntrada: string
  horarioSaida: string
  usuario: string
  /** Vazio significa sem nova senha: na edição a atual é mantida. */
  senha: string
  /** Apenas no cadastro, quando o formulário solicita a filial. */
  filialId?: string
}

interface EmployeeFormModalProps {
  employee?: Employee
  existing: Employee[]
  /** Com 2+ filiais o formulário de cadastro pergunta a qual filial o funcionário pertence. */
  branches?: Filial[]
  onSave: (values: EmployeeFormValues) => Promise<void> | void
  onClose: () => void
}

type Errors = Partial<Record<keyof EmployeeFormValues, string>>

// Mesmas regras do backend: usuário de 3 a 40 caracteres sem espaços, senha com 8 ou mais.
const USUARIO = /^\S{3,40}$/
const SENHA_MINIMA = 8

const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({ employee, existing, branches = [], onSave, onClose }) => {
  const { t } = useTranslation()
  const uid = useId()
  const hasLogin = Boolean(employee?.usuario)
  const showBranch = !employee && branches.length >= 2
  const [values, setValues] = useState<EmployeeFormValues>({
    nome: employee?.nome ?? '',
    telefone: employee?.telefone ?? '',
    cargo: employee?.cargo ?? '',
    horarioEntrada: employee?.horarioEntrada ?? '',
    horarioSaida: employee?.horarioSaida ?? '',
    usuario: employee?.usuario ?? '',
    senha: '',
    // Com apenas uma filial não há seletor: o funcionário é atribuído a ela diretamente.
    ...(!employee && branches.length > 0 && { filialId: branches[0]._id }),
  })
  const [errors, setErrors] = useState<Errors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)

  const update = (field: keyof EmployeeFormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const next: Errors = {}
    const usuario = values.usuario.trim()
    // Cadastro exige login; edição sem login pode adicionar um, usuário e senha juntos.
    const loginRequired = !employee || (!hasLogin && (usuario !== '' || values.senha !== ''))
    for (const field of ['nome', 'cargo'] as const) {
      if (values[field].trim() === '') next[field] = t('team.required')
    }
    if (!hasLogin) {
      if (usuario === '') {
        if (loginRequired) next.usuario = t('team.required')
      } else if (!USUARIO.test(usuario)) {
        next.usuario = t('team.usernameInvalid')
      } else if (isUsernameTaken(existing, usuario, employee?.id)) {
        next.usuario = t('team.usernameTaken')
      }
    }
    if (values.senha.trim() === '') {
      if (loginRequired) next.senha = t('team.required')
    } else if (values.senha.length < SENHA_MINIMA) {
      next.senha = t('team.passwordTooShort')
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    try {
      await onSave({
        ...values,
        nome: values.nome.trim(),
        cargo: values.cargo.trim(),
        usuario: values.usuario.trim(),
        telefone: values.telefone.trim(),
        senha: values.senha.trim() === '' ? '' : values.senha,
      })
    } catch {
      // ignora
    } finally {
      setSaving(false)
    }
  }

  const field = (
    name: keyof EmployeeFormValues,
    label: string,
    placeholder: string,
    options: { type?: string; icon?: 'clock' | 'password'; disabled?: boolean } = {}
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
            disabled={saving || options.disabled}
          />
          {isPassword && (
            <button
              type="button"
              className={styles.rightButton}
              aria-label={showPassword ? t('team.hidePassword') : t('team.showPassword')}
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={saving}
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
    <Modal title={employee ? t('team.editEmployeeTitle') : t('team.newEmployeeTitle')} onClose={saving ? () => {} : onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {field('nome', t('team.labelEmployeeName'), t('team.phEmployeeName'))}
        {field('telefone', t('team.labelPhone'), t('team.phPhone'), { type: 'tel' })}
        {field('cargo', t('team.labelRole'), t('team.phRole'))}
        <div className={styles.row}>
          {field('horarioEntrada', t('team.labelEntry'), '', { type: 'time', icon: 'clock' })}
          {field('horarioSaida', t('team.labelExit'), '', { type: 'time', icon: 'clock' })}
        </div>
        {showBranch && (
          <div className={styles.field}>
            <label htmlFor={`${uid}-filialId`} className={styles.label}>
              {t('machines.labelBranch')}
            </label>
            <Select
              id={`${uid}-filialId`}
              value={values.filialId ?? ''}
              disabled={saving}
              onChange={(val) => setValues((prev) => ({ ...prev, filialId: val }))}
              options={branches.map((branch) => ({
                value: branch._id,
                label: branch.nome,
              }))}
            />
          </div>
        )}
        <div className={styles.divider} />
        {/* Um login existente mantém seu usuário; o backend não possui rota para renomeá-lo. */}
        {field('usuario', t('team.labelUsername'), t('team.phUsername'), { disabled: hasLogin })}
        {field('senha', t('team.labelPassword'), hasLogin ? t('team.phPasswordKeep') : t('team.phPassword'), { icon: 'password' })}
        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={buttons.confirm} disabled={saving} aria-busy={saving}>
            {saving && <Spinner />}
            {saving ? t('common.saving') : t('team.confirm')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default EmployeeFormModal

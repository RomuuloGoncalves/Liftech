import React, { useId, useState } from 'react'
import { Clock, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import type { Employee } from '../../data/team'
import styles from './TeamForm.module.css'

interface EmployeeInfoModalProps {
  employee: Employee
  onClose: () => void
}

const EmployeeInfoModal: React.FC<EmployeeInfoModalProps> = ({ employee, onClose }) => {
  const { t } = useTranslation()
  const uid = useId()
  const [showPassword, setShowPassword] = useState(false)

  const field = (name: string, label: string, value: string, options: { icon?: 'clock' | 'password' } = {}) => {
    const id = `${uid}-${name}`
    const isPassword = options.icon === 'password'
    const inputClass = [
      styles.input,
      options.icon === 'clock' ? styles.withLeftIcon : '',
      isPassword ? styles.withRightIcon : '',
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
            type={isPassword && !showPassword ? 'password' : 'text'}
            className={inputClass}
            value={value}
            readOnly
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
      </div>
    )
  }

  return (
    <Modal title={t('team.employeeInfoTitle')} onClose={onClose}>
      <div className={styles.form}>
        {field('nome', t('team.labelEmployeeName'), employee.nome)}
        {field('telefone', t('team.labelPhone'), employee.telefone)}
        {field('cargo', t('team.labelRole'), employee.cargo)}
        <div className={styles.row}>
          {field('entrada', t('team.labelEntry'), employee.horarioEntrada, { icon: 'clock' })}
          {field('saida', t('team.labelExit'), employee.horarioSaida, { icon: 'clock' })}
        </div>
        <div className={styles.divider} />
        {field('usuario', t('team.labelUsername'), employee.usuario)}
        {field('senha', t('team.labelPassword'), employee.senha, { icon: 'password' })}
      </div>
    </Modal>
  )
}

export default EmployeeInfoModal

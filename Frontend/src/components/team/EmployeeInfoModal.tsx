import React, { useId } from 'react'
import { Clock } from 'lucide-react'
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

  const field = (name: string, label: string, value: string, options: { icon?: 'clock' } = {}) => {
    const id = `${uid}-${name}`
    const inputClass = [styles.input, options.icon === 'clock' ? styles.withLeftIcon : ''].join(' ')

    return (
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <div className={styles.inputWrap}>
          {options.icon === 'clock' && <Clock size={14} className={styles.leftIcon} aria-hidden="true" />}
          <input id={id} type="text" className={inputClass} value={value} readOnly />
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
        {field('usuario', t('team.labelUsername'), employee.usuario ?? '')}
      </div>
    </Modal>
  )
}

export default EmployeeInfoModal

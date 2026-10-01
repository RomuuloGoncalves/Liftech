import React from 'react'
import { Pencil, Trash2, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Employee } from '../../data/team'
import styles from './EmployeeCard.module.css'

interface EmployeeCardProps {
  employee: Employee
  onOpen: (employee: Employee) => void
  onToggleAccess: (employee: Employee) => void
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

const EmployeeCard: React.FC<EmployeeCardProps> = ({ employee, onOpen, onToggleAccess, onEdit, onDelete }) => {
  const { t } = useTranslation()
  const allowed = employee.acesso === 'Permitido'
  const name = employee.nome

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.openArea}
        aria-label={t('team.openDetails', { name })}
        onClick={() => onOpen(employee)}
      >
        <span className={styles.avatar}>
          <User size={22} />
        </span>
        <span className={styles.info}>
          <span className={styles.name}>{name}</span>
          <span className={styles.code}>{employee.matricula}(ID)</span>
          <span className={styles.access}>
            {t('team.accessLabel')}:{' '}
            <span className={allowed ? styles.allowed : styles.denied}>
              {allowed ? t('team.accessAllowed') : t('team.accessDenied')}
            </span>
          </span>
        </span>
      </button>

      <div className={styles.actions}>
        <div className={styles.iconButtons}>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.delete}`}
            aria-label={t('team.remove', { name })}
            onClick={() => onDelete(employee)}
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            className={`${styles.iconButton} ${styles.edit}`}
            aria-label={t('team.edit', { name })}
            onClick={() => onEdit(employee)}
          >
            <Pencil size={14} />
          </button>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={allowed}
          aria-label={t('team.toggleAccess', { name })}
          className={`${styles.switch} ${allowed ? styles.switchOn : ''}`}
          onClick={() => onToggleAccess(employee)}
        >
          <span className={styles.knob} />
        </button>
      </div>
    </article>
  )
}

export default EmployeeCard

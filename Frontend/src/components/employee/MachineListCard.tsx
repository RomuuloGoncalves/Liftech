import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import type { Machine } from '../../data/machines'
import StatusBadge from '../machines/StatusBadge'
import styles from './MachineListCard.module.css'

interface MachineListCardProps {
  machine: Machine
  extra?: { date: string; time: string }
  actionLabel: string
  onAction: () => void
  actionDisabled?: boolean
}

const MachineListCard: React.FC<MachineListCardProps> = ({
  machine,
  extra,
  actionLabel,
  onAction,
  actionDisabled,
}) => {
  const { t } = useTranslation()
  const { nome, identificacao, setor } = machine

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div className={styles.names}>
          <h3 className={styles.nome}>{nome}</h3>
          <p className={styles.identificacao}>{identificacao}</p>
        </div>
        <StatusBadge status={machine.status} className={styles.chip} />
      </div>
      <hr className={styles.divider} />
      <div className={styles.bottom}>
        <div className={styles.field}>
          <span className={styles.label}>{t('employee.common.sector')}</span>
          <span className={styles.value}>{setor}</span>
        </div>
        {extra && (
          <div className={styles.field}>
            <span className={styles.label}>{t('employee.common.dateTime')}</span>
            <span className={styles.value}>{extra.date}</span>
            <span className={styles.value}>{extra.time}</span>
          </div>
        )}
        <button type="button" className={styles.action} onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

export default MachineListCard

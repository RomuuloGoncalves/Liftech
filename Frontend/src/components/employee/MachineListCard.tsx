import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import type { Machine, MachineStatus } from '../../data/machines'
import styles from './MachineListCard.module.css'

interface MachineListCardProps {
  machine: Machine
  extra?: { date: string; time: string }
  actionLabel: string
  onAction: () => void
  actionDisabled?: boolean
}

const STATUS: Record<MachineStatus, { key: string; className: string }> = {
  Disponível: { key: 'employee.common.available', className: styles.available },
  'Em uso': { key: 'employee.common.inUse', className: styles.inUse },
  Manutenção: { key: 'employee.common.maintenance', className: styles.maintenance },
  Offline: { key: 'employee.common.offline', className: styles.offline },
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
  const status = machine.dispositivoConectado.status

  return (
    <article className={styles.card}>
      <div className={styles.top}>
        <div className={styles.names}>
          <h3 className={styles.nome}>{nome}</h3>
          <p className={styles.identificacao}>{identificacao}</p>
        </div>
        <span className={`${styles.chip} ${STATUS[status].className}`}>{t(STATUS[status].key)}</span>
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

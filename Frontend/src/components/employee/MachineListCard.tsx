import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import type { Machine, MachineStatus } from '../../data/machines'
import StatusBadge from '../machines/StatusBadge'
import { InfoField } from '../common/InfoField'
import styles from './MachineListCard.module.css'

interface MachineListCardProps {
  /** No histórico os dados vêm da sessão; o status só existe quando a máquina está na lista atual. */
  machine: Pick<Machine, 'nome' | 'identificacao' | 'setor'> & { status?: MachineStatus }
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
        {machine.status && <StatusBadge status={machine.status} className={styles.chip} />}
      </div>
      <hr className={styles.divider} />
      <div className={styles.bottom}>
        <dl className={styles.fields}>
        <InfoField label={t('employee.common.sector')} title={setor}>
          {setor}
        </InfoField>
        {extra && (
          <InfoField label={t('employee.common.dateTime')} valueClassName={styles.dateTime}>
            <span>{extra.date}</span>
            <span>{extra.time}</span>
          </InfoField>
        )}
        </dl>
        <button type="button" className={styles.action} onClick={onAction} disabled={actionDisabled}>
          {actionLabel}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}

export default MachineListCard

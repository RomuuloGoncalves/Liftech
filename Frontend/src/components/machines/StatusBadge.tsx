import React from 'react'
import { useTranslation } from 'react-i18next'
import type { MachineStatus } from '../../data/machines'
import styles from './StatusBadge.module.css'

/** Fundo sólido do cabeçalho do card da Frota, por status. */
// eslint-disable-next-line react-refresh/only-export-components
export const STATUS_TONE: Record<MachineStatus, string> = {
  disponivel: styles.toneDisponivel,
  em_uso: styles.toneEmUso,
  manutencao: styles.toneManutencao,
  alerta: styles.toneAlerta,
  offline: styles.toneOffline,
}

const StatusBadge: React.FC<{ status: MachineStatus; className?: string }> = ({ status, className }) => {
  const { t } = useTranslation()
  return (
    <span className={[styles.badge, styles[status], className].filter(Boolean).join(' ')}>
      {t(`machines.status.${status}`)}
    </span>
  )
}

export default StatusBadge

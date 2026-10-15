import React from 'react'
import { MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Machine } from '../../data/machines'
import styles from './MachineCard.module.css'

interface MachineCardProps {
  machine: Machine
  onOpen?: (machine: Machine) => void
}

const STATUS_CLASS: Record<Machine['status'], string> = {
  disponivel: styles.statusAvailable,
  em_uso: styles.statusInUse,
  manutencao: styles.statusMaintenance,
  alerta: styles.statusOffline,
  offline: styles.statusOffline,
}

function formatTempoSessao(minutos: number): string {
  return `${minutos} minutos`
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onOpen }) => {
  const { t } = useTranslation()
  const { identificacao, nome, setor, dispositivoConectado, tempoSessaoMinutos } = machine

  const getStatusTranslation = (status: string) => {
    if (status === 'disponivel') return t('machines.statusAvailable')
    if (status === 'em_uso') return t('machines.statusInUse')
    if (status === 'manutencao') return t('machines.statusMaintenance')
    if (status === 'offline') return t('employee.common.offline')
    return status
  }

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.identity}>
          <div className={styles.names}>
            <h3 className={styles.nome}>
              {onOpen ? (
                <button
                  type="button"
                  className={styles.openButton}
                  aria-label={t('machines.openDetails', { name: nome })}
                  onClick={() => onOpen(machine)}
                >
                  {nome}
                </button>
              ) : (
                nome
              )}
            </h3>
            <span className={styles.identificacao}>{identificacao}(ID)</span>
          </div>
        </div>
        <button type="button" className={styles.menuButton} aria-label={`Mais ações para ${identificacao}`}>
          <MoreVertical size={18} />
        </button>
      </div>

      <dl className={styles.details}>
        <div className={styles.detailRow}>
          <dt>{t('machines.sector')}:</dt>
          <dd>{setor}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>{t('machines.labelMac')}:</dt>
          <dd>{dispositivoConectado.enderecoMac}</dd>
        </div>
      </dl>

      <div className={styles.bottomRow}>
        <span className={`${styles.statusBadge} ${STATUS_CLASS[machine.status]}`}>
          {getStatusTranslation(machine.status)}
        </span>
        <span className={styles.session}>
          {t('machines.sessionTime')} <strong>{formatTempoSessao(tempoSessaoMinutos)}</strong>
        </span>
      </div>
    </article>
  )
}

export default MachineCard

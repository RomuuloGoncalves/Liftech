import React from 'react'
import { Forklift, MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Machine } from '../../data/machines'
import styles from './MachineCard.module.css'

interface MachineCardProps {
  machine: Machine
}

const STATUS_CLASS: Record<Machine['dispositivoConectado']['status'], string> = {
  Disponível: styles.statusAvailable,
  'Em uso': styles.statusInUse,
  Manutenção: styles.statusMaintenance,
  Offline: styles.statusOffline,
}

function formatTempoSessao(minutos: number): string {
  return `${minutos} min`
}

const MachineCard: React.FC<MachineCardProps> = ({ machine }) => {
  const { t } = useTranslation()
  const { identificacao, nome, setor, dispositivoConectado, operadorConectado, tempoSessaoMinutos } = machine

  const getStatusTranslation = (status: string) => {
    if (status === 'Disponível') return t('machines.statusAvailable')
    if (status === 'Em uso') return t('machines.statusInUse')
    if (status === 'Manutenção' || status === 'Em manutenção') return t('machines.statusMaintenance')
    return status
  }

  return (
    <article className={styles.card}>
      <div className={styles.topRow}>
        <div className={styles.identity}>
          <span className={styles.icon}>
            <Forklift size={20} />
          </span>
          <div className={styles.names}>
            <h3 className={styles.nome}>{nome}</h3>
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
        {operadorConectado ? (
          <div className={styles.detailRow}>
            <dt>{t('machines.operator')}:</dt>
            <dd>{operadorConectado.nome}</dd>
          </div>
        ) : (
          <div className={styles.detailRow}>
            <dt>{t('machines.operator')}:</dt>
            <dd className={styles.emptyOperator}>{t('machines.noOperator')}</dd>
          </div>
        )}
      </dl>

      <div className={styles.bottomRow}>
        <span className={`${styles.statusBadge} ${STATUS_CLASS[dispositivoConectado.status]}`}>
          {getStatusTranslation(dispositivoConectado.status)}
        </span>
        <span className={styles.session}>
          {t('machines.sessionTime')} <strong>{formatTempoSessao(tempoSessaoMinutos)}</strong>
        </span>
      </div>
    </article>
  )
}

export default MachineCard

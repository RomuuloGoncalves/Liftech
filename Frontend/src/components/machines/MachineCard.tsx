import React from 'react'
import { MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Machine } from '../../data/machines'
import { InfoField } from '../common/InfoField'
import StatusBadge from './StatusBadge'
import styles from './MachineCard.module.css'

interface MachineCardProps {
  machine: Machine
  onOpen?: (machine: Machine) => void
}

function formatTempoSessao(minutos: number): string {
  return `${minutos} minutos`
}

const MachineCard: React.FC<MachineCardProps> = ({ machine, onOpen }) => {
  const { t } = useTranslation()
  const { identificacao, nome, setor, dispositivoConectado, tempoSessaoMinutos } = machine

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
        <InfoField label={`${t('machines.sector')}:`} title={setor}>
          {setor}
        </InfoField>
        <InfoField label={`${t('machines.labelMac')}:`} title={dispositivoConectado.enderecoMac}>
          {dispositivoConectado.enderecoMac}
        </InfoField>
      </dl>

      <div className={styles.bottomRow}>
        <StatusBadge status={machine.status} />
        <dl className={styles.session}>
          <InfoField label={t('machines.sessionTime')} highlight>
            {formatTempoSessao(tempoSessaoMinutos)}
          </InfoField>
        </dl>
      </div>
    </article>
  )
}

export default MachineCard

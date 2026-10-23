import React, { useEffect, useRef, useState } from 'react'
import { Lock, MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Machine, MachineStatus, UrgencyLevel } from '../../data/machines'
import { formatAlertDate } from '../../utils/format'
import { STATUS_TONE } from '../machines/StatusBadge'
import styles from './FleetCard.module.css'

interface FleetCardProps {
  machine: Machine
  /** Card de ocorrência (Alertas): mostra a data e a urgência dela no lugar do destaque do status. */
  incident?: { data: string; hora: string; urgency?: UrgencyLevel }
  /** Sem `onMove`/`onRemove` o card não tem menu; sem `onDragStart` não é arrastável. */
  moveTargets?: { id: string; nome: string }[]
  onOpen: (machine: Machine) => void
  onDragStart?: (machineId: string) => void
  onMove?: (machineId: string, categoryId: string) => void
  onRemove?: (machineId: string) => void
  /** Cadeado aparece só com `categoriaTravada`; o clique destrava. */
  onToggleLock?: (machineId: string) => void
  /** Card sendo arrastado agora. */
  isDragging?: boolean
  /** Card que acabou de entrar na linha (destaque de 1 s). */
  isArriving?: boolean
}

interface Highlight {
  label: string
  value: string
  tone: string
  left?: { label: string; value: string }
}

const URGENCY_TONE: Record<UrgencyLevel, string> = {
  media: styles.caution,
  alta: styles.warning,
  critica: styles.danger,
}

const FleetCard: React.FC<FleetCardProps> = ({
  machine,
  incident,
  moveTargets = [],
  onOpen,
  onDragStart,
  onMove,
  onRemove,
  onToggleLock,
  isDragging = false,
  isArriving = false,
}) => {
  const { t, i18n } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const undefinedText = t('fleet.cardUndefined')

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [menuOpen])

  const pick = (action: () => void) => {
    action()
    setMenuOpen(false)
  }

  // ponytail: data e hora do alerta em UTC, como o formatAlertDate; trocar para o fuso local se pedirem.
  const alertaEm = machine.alertaEm ?? undefined
  // Horário local, igual aos incidentes de Alertas ('sv' dá YYYY-MM-DD e HH:mm:ss).
  const alertAt = incident ?? (alertaEm && { data: new Date(alertaEm).toLocaleDateString('sv'), hora: new Date(alertaEm).toLocaleTimeString('sv') })
  const urgencyTone = incident?.urgency ? URGENCY_TONE[incident.urgency] : styles.danger
  const alertHighlight: Highlight = {
    label: t('fleet.cardUrgency'),
    value: incident?.urgency ? t(`alerts.urgency.${incident.urgency}`) : t('fleet.cardUrgent'),
    tone: urgencyTone,
    left: {
      label: t('fleet.cardDateTime'),
      value: alertAt ? `${formatAlertDate(alertAt.data, i18n.language)}, ${alertAt.hora}` : undefinedText,
    },
  }
  const highlights: Partial<Record<MachineStatus, Highlight>> = {
    alerta: alertHighlight,
    em_uso: {
      label: t('fleet.cardSessionTime'),
      value: t('fleet.cardMinutes', { count: machine.tempoSessaoMinutos }),
      tone: styles.session,
    },
    disponivel: {
      label: t('fleet.cardWeeklyHours'),
      value:
        machine.tempoUsoTotalHoras === undefined
          ? undefinedText
          : t('fleet.cardHours', { count: machine.tempoUsoTotalHoras }),
      tone: styles.success,
    },
  }
  const highlight = incident ? alertHighlight : highlights[machine.status]

  return (
    <article
      className={styles.card}
      draggable={Boolean(onDragStart)}
      data-dragging={isDragging || undefined}
      data-arriving={isArriving || undefined}
      onDragStart={(event) => {
        event.dataTransfer?.setData('text/plain', machine.id)
        onDragStart?.(machine.id)
      }}
    >
      <div className={`${styles.topRow} ${incident ? urgencyTone : STATUS_TONE[machine.status]}`}>
        <div className={styles.names}>
          <h3 className={styles.nome}>
            <button
              type="button"
              className={styles.openButton}
              aria-label={t('machines.openDetails', { name: machine.nome })}
              onClick={() => onOpen(machine)}
            >
              {machine.nome}
            </button>
          </h3>
          <span className={styles.code}>{machine.identificacao}(ID)</span>
        </div>
        {machine.categoriaTravada && (
          <button
            type="button"
            className={styles.menuButton}
            aria-label={t('fleet.unlock')}
            title={t('fleet.unlock')}
            disabled={!onToggleLock}
            onClick={() => onToggleLock?.(machine.id)}
          >
            <Lock size={14} />
          </button>
        )}
        {onMove && onRemove && (
          <div className={styles.menuWrap} ref={menuRef}>
            <button
              type="button"
              className={styles.menuButton}
              aria-label={t('fleet.moreActions', { name: machine.identificacao })}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div
                className={styles.menu}
                role="menu"
                onKeyDown={(event) => event.key === 'Escape' && setMenuOpen(false)}
              >
                <span className={styles.menuHeading}>{t('fleet.moveTo')}</span>
                {moveTargets.map((target) => (
                  <button
                    key={target.id}
                    type="button"
                    role="menuitem"
                    className={styles.menuItem}
                    onClick={() => pick(() => onMove(machine.id, target.id))}
                  >
                    {target.nome}
                  </button>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  className={`${styles.menuItem} ${styles.menuRemove}`}
                  onClick={() => pick(() => onRemove(machine.id))}
                >
                  {t('fleet.removeFromCategory')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* <StatusBadge status={machine.status} className={styles.badge} /> */}

      <div className={styles.body}>
        <dl className={styles.details}>
          <div>
            <dt>{t('fleet.cardSector')}</dt>
            <dd>{machine.setor || undefinedText}</dd>
          </div>
          {machine.status === 'manutencao' && !incident ? (
            <div>
              <dt>{t('fleet.cardMac')}</dt>
              <dd>{machine.dispositivoConectado.enderecoMac || undefinedText}</dd>
            </div>
          ) : (
            <div>
              <dt>{t('fleet.cardEmployee')}</dt>
              <dd>{machine.operadorConectado?.nome || undefinedText}</dd>
            </div>
          )}
          {highlight?.left && (
            <div>
              <dt>{highlight.left.label}</dt>
              <dd>{highlight.left.value}</dd>
            </div>
          )}
        </dl>

        {highlight && (
          <dl className={styles.highlight}>
            <div>
              <dt>{highlight.label}</dt>
              <dd className={highlight.tone}>{highlight.value}</dd>
            </div>
          </dl>
        )}
      </div>
    </article>
  )
}

export default FleetCard

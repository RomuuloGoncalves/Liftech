import React, { useEffect, useRef, useState } from 'react'
import { Forklift, MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CategoryKind } from '../../data/fleet'
import type { Machine } from '../../data/machines'
import styles from './FleetCard.module.css'

interface FleetCardProps {
  machine: Machine
  kind: CategoryKind
  lastAccident?: { data: string; hora: string }
  moveTargets: { id: string; nome: string }[]
  onOpen: (machine: Machine) => void
  onDragStart: (machineId: string) => void
  onMove: (machineId: string, categoryId: string) => void
  onRemove: (machineId: string) => void
}

interface Highlight {
  label: string
  value: string
  tone: string
  left?: { label: string; value: string }
}

/** "2026-01-23" + "14:38:20" -> "23 janeiro 2026, 14:38:20". */
function formatAccident(data: string, hora: string, language: string): string {
  const [year, month, day] = data.split('-').map(Number)
  const parts = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    .formatToParts(new Date(Date.UTC(year, month - 1, day)))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${get('day')} ${get('month')} ${get('year')}, ${hora}`
}

const FleetCard: React.FC<FleetCardProps> = ({
  machine,
  kind,
  lastAccident,
  moveTargets,
  onOpen,
  onDragStart,
  onMove,
  onRemove,
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

  const highlights: Partial<Record<CategoryKind, Highlight>> = {
    acidentes: {
      label: t('fleet.cardUrgency'),
      value: t('fleet.cardUrgent'),
      tone: styles.danger,
      left: {
        label: t('fleet.cardDateTime'),
        value: lastAccident ? formatAccident(lastAccident.data, lastAccident.hora, i18n.language) : undefinedText,
      },
    },
    ativas: {
      label: t('fleet.cardSessionTime'),
      value: t('fleet.cardMinutes', { count: machine.tempoSessaoMinutos }),
      tone: styles.info,
    },
    disponiveis: {
      label: t('fleet.cardWeeklyHours'),
      value:
        machine.tempoUsoTotalHoras === undefined
          ? undefinedText
          : t('fleet.cardHours', { count: machine.tempoUsoTotalHoras }),
      tone: styles.success,
    },
  }
  const highlight = highlights[kind]

  return (
    <article
      className={styles.card}
      draggable
      onDragStart={(event) => {
        event.dataTransfer?.setData('text/plain', machine.id)
        onDragStart(machine.id)
      }}
    >
      <div className={styles.topRow}>
        <span className={styles.icon}>
          <Forklift size={20} />
        </span>
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
      </div>

      <dl className={styles.details}>
        <div>
          <dt>{t('fleet.cardSector')}</dt>
          <dd>{machine.setor || undefinedText}</dd>
        </div>
        {kind === 'manutencao' ? (
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
      </dl>

      {highlight && (
        <dl className={styles.bottomRow}>
          {highlight.left && (
            <div>
              <dt>{highlight.left.label}</dt>
              <dd>{highlight.left.value}</dd>
            </div>
          )}
          <div className={styles.highlight}>
            <dt>{highlight.label}</dt>
            <dd className={highlight.tone}>{highlight.value}</dd>
          </div>
        </dl>
      )}
    </article>
  )
}

export default FleetCard

import React, { useId, useMemo, useState } from 'react'
import { Calendar, Cpu, MapPin, Pencil, Timer, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import {
  DEFAULT_PERIOD,
  filterEvents,
  type Machine,
  type MachineEvent,
  type MachineEventType,
  type MachineStatus,
} from '../../data/machines'
import { formatDuration, formatEventDate, formatHours } from '../../utils/format'
import styles from './MachineDetailModal.module.css'

interface MachineDetailModalProps {
  machine: Machine
  events: MachineEvent[]
  onEdit: (machine: Machine) => void
  onDelete: (machine: Machine) => void
  onClose: () => void
}

const STATUS_CLASS: Record<MachineStatus, string> = {
  Disponível: styles.statusAvailable,
  'Em uso': styles.statusInUse,
  Manutenção: styles.statusMaintenance,
  Offline: styles.statusOffline,
}

const STATUS_KEY: Partial<Record<MachineStatus, string>> = {
  Disponível: 'machines.statusAvailable',
  'Em uso': 'machines.statusInUse',
  Manutenção: 'machines.statusMaintenance',
}

const TABS: { type: MachineEventType; labelKey: string }[] = [
  { type: 'acidente', labelKey: 'machines.tabAccidents' },
  { type: 'manutencao', labelKey: 'machines.tabMaintenance' },
]

const MachineDetailModal: React.FC<MachineDetailModalProps> = ({ machine, events, onEdit, onDelete, onClose }) => {
  const { t, i18n } = useTranslation()
  const uid = useId()
  const [tab, setTab] = useState<MachineEventType>('acidente')
  const [from, setFrom] = useState(DEFAULT_PERIOD.from)
  const [to, setTo] = useState(DEFAULT_PERIOD.to)

  const visibleEvents = useMemo(() => filterEvents(events, { tipo: tab, from, to }), [events, tab, from, to])
  const { status, enderecoMac, nomeDispositivo } = machine.dispositivoConectado
  const statusKey = STATUS_KEY[status]
  const dash = '—'

  const infoRows = [
    { icon: <MapPin size={14} />, label: t('machines.detailSector'), value: machine.setor || dash },
    {
      icon: <Timer size={14} />,
      label: t('machines.detailTotalUsage'),
      value: machine.tempoUsoTotalHoras === undefined ? dash : formatHours(machine.tempoUsoTotalHoras, i18n.language),
    },
    { icon: <Cpu size={14} />, label: t('machines.detailDeviceName'), value: nomeDispositivo || dash },
  ]

  return (
    <Modal
      title={machine.nome}
      onClose={onClose}
      badge={
        <span className={`${styles.badge} ${STATUS_CLASS[status]}`}>{statusKey ? t(statusKey) : status}</span>
      }
      footer={
        <>
          <button type="button" className={`${styles.action} ${styles.edit}`} onClick={() => onEdit(machine)}>
            <Pencil size={14} />
            {t('machines.editMachine')}
          </button>
          <button type="button" className={`${styles.action} ${styles.delete}`} onClick={() => onDelete(machine)}>
            <Trash2 size={14} />
            {t('machines.deleteMachine')}
          </button>
        </>
      }
    >
      <dl className={styles.meta}>
        <div className={styles.metaRow}>
          <dt>{t('machines.detailCode')}:</dt>
          <dd>{machine.identificacao}(ID)</dd>
        </div>
        <div className={styles.metaRow}>
          <dt>{t('machines.detailMac')}:</dt>
          <dd>{enderecoMac}</dd>
        </div>
      </dl>

      <ul className={styles.info}>
        {infoRows.map((row) => (
          <li key={row.label} className={styles.infoRow}>
            <span className={styles.infoIcon}>{row.icon}</span>
            <span className={styles.infoLabel}>{row.label}</span>
            <span className={styles.infoValue}>{row.value}</span>
          </li>
        ))}
      </ul>

      <div className={styles.controls}>
        <div role="tablist" aria-label={t('machines.historyLabel')} className={styles.tabs}>
          {TABS.map(({ type, labelKey }) => (
            <button
              key={type}
              type="button"
              role="tab"
              id={`${uid}-tab-${type}`}
              aria-selected={tab === type}
              aria-controls={`${uid}-panel`}
              className={`${styles.tab} ${tab === type ? styles.tabActive : ''}`}
              onClick={() => setTab(type)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        <div className={styles.period}>
          <Calendar size={12} aria-hidden="true" />
          <input
            type="date"
            className={styles.dateInput}
            aria-label={t('machines.periodFrom')}
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          />
          <span aria-hidden="true">-</span>
          <input
            type="date"
            className={styles.dateInput}
            aria-label={t('machines.periodTo')}
            value={to}
            onChange={(event) => setTo(event.target.value)}
          />
        </div>
      </div>

      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${tab}`} className={styles.history}>
        {visibleEvents.length === 0 ? (
          <p className={styles.empty}>{t('machines.historyEmpty')}</p>
        ) : (
          <ol className={styles.timeline}>
            {visibleEvents.map((event) => (
              <li key={event.id} className={styles.event}>
                <span className={styles.operator}>{event.operador}</span>
                <span>{formatEventDate(event.data, i18n.language)}</span>
                <span>
                  {event.inicio} ~ {event.fim} ({formatDuration(event.inicio, event.fim, i18n.language)})
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Modal>
  )
}

export default MachineDetailModal

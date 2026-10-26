import React, { useEffect, useId, useMemo, useState } from 'react'
import { Calendar, CircleUser, Cpu, MapPin, Pencil, Timer, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import {
  DEFAULT_PERIOD,
  MACHINE_STATUSES,
  defaultPeriodTo,
  incidentToEvent,
  type Machine,
  type MachineEvent,
  type MachineEventType,
  type MachineStatus,
} from '../../data/machines'
import { incidentService } from '../../services/incidentService'
import { formatDuration, formatEventDate, formatHours } from '../../utils/format'
import StatusBadge from './StatusBadge'
import styles from './MachineDetailModal.module.css'

interface MachineDetailModalProps {
  machine: Machine
  onEdit?: (machine: Machine) => void
  onDelete?: (machine: Machine) => void
  onClose: () => void
  onChangeStatus?: (status: MachineStatus) => void
  onToggleLock?: (valor: boolean) => void
  /** `fleet`: linhas e abas do frame da Frota, sem Editar/Excluir. `alerts`: igual, com a aba de alertas primeiro e sem selo de status. */
  variant?: 'overview' | 'fleet' | 'alerts'
}

const TABS: Record<'overview' | 'fleet' | 'alerts', { type: MachineEventType; labelKey: string }[]> = {
  overview: [
    { type: 'acidente', labelKey: 'machines.tabAccidents' },
    { type: 'manutencao', labelKey: 'machines.tabMaintenance' },
  ],
  fleet: [
    { type: 'manutencao', labelKey: 'fleet.tabRepairs' },
    { type: 'acidente', labelKey: 'fleet.tabAlerts' },
  ],
  alerts: [
    { type: 'acidente', labelKey: 'fleet.tabAlerts' },
    { type: 'manutencao', labelKey: 'fleet.tabRepairs' },
  ],
}

const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machine,
  onEdit,
  onDelete,
  onClose,
  onChangeStatus,
  onToggleLock,
  variant = 'overview',
}) => {
  const { t, i18n } = useTranslation()
  const uid = useId()
  const tabs = TABS[variant]
  const [tab, setTab] = useState<MachineEventType>(tabs[0].type)
  const [from, setFrom] = useState(DEFAULT_PERIOD.from)
  const [to, setTo] = useState(defaultPeriodTo)
  const [accidents, setAccidents] = useState<MachineEvent[]>([])

  useEffect(() => {
    let stale = false
    incidentService.listar({ machineId: machine.id, from: from || undefined, to: to || undefined }).then(
      (list) => !stale && setAccidents(list.map(incidentToEvent)),
      () => !stale && setAccidents([])
    )
    return () => {
      stale = true
    }
  }, [machine.id, from, to])

  const visibleEvents = useMemo(
    () => (tab === 'acidente' ? accidents : []),
    [accidents, tab]
  )
  const { enderecoMac, nomeDispositivo } = machine.dispositivoConectado
  const dash = '—'

  const sectorRow = { icon: <MapPin size={14} />, label: t('machines.detailSector'), value: machine.setor || dash }
  const deviceRow = { icon: <Cpu size={14} />, label: t('machines.detailDeviceName'), value: nomeDispositivo || dash }
  const infoRows =
    variant !== 'overview'
      ? [
          sectorRow,
          {
            icon: <CircleUser size={14} />,
            label: t('fleet.detailEmployee'),
            value: machine.operadorConectado?.nome || dash,
          },
          {
            icon: <Timer size={14} />,
            label: t('fleet.detailSessionUsage'),
            value: t('fleet.cardMinutes', { count: machine.tempoSessaoMinutos }),
          },
          deviceRow,
        ]
      : [
          sectorRow,
          {
            icon: <Timer size={14} />,
            label: t('machines.detailTotalUsage'),
            value:
              machine.tempoUsoTotalHoras === undefined ? dash : formatHours(machine.tempoUsoTotalHoras, i18n.language),
          },
          deviceRow,
        ]

  return (
    <Modal
      title={machine.nome}
      onClose={onClose}
      badge={
        variant !== 'alerts' && (
          <StatusBadge status={machine.status} className={styles.badge} />
        )
      }
      footer={
        onEdit &&
        onDelete && (
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
        )
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

      {(onChangeStatus || onToggleLock) && (
        <div className={styles.statusControls}>
          {onChangeStatus && (
            <label className={styles.statusField}>
              {t('machines.changeStatus')}
              <select
                className={styles.dateInput}
                value={machine.status}
                onChange={(event) => onChangeStatus(event.target.value as MachineStatus)}
              >
                {MACHINE_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {t(`machines.status.${option}`)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {onToggleLock && (
            <button
              type="button"
              className={`${styles.action} ${styles.edit}`}
              onClick={() => onToggleLock(!machine.categoriaTravada)}
            >
              {t(machine.categoriaTravada ? 'fleet.unlock' : 'fleet.lock')}
            </button>
          )}
        </div>
      )}

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
          {tabs.map(({ type, labelKey }) => (
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
          <span className={styles.dateLabel} > Date:</span>
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
                  {event.inicio === event.fim
                    ? event.inicio
                    : `${event.inicio} ~ ${event.fim} (${formatDuration(event.inicio, event.fim, i18n.language)})`}
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

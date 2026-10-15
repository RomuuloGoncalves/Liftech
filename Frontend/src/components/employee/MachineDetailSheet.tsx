import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarDays, Cpu, MapPin } from 'lucide-react'
import BottomSheet from './BottomSheet'
import { DEFAULT_PERIOD, type Machine } from '../../data/machines'
import { USAGE_HISTORY, filterUsageHistory } from '../../data/employeeArea'
import { useWorkSession } from '../../hooks/useWorkSession'
import styles from './MachineDetailSheet.module.css'

interface MachineDetailSheetProps {
  machine: Machine
  onClose: () => void
}

const MachineDetailSheet: React.FC<MachineDetailSheetProps> = ({ machine, onClose }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { session, start } = useWorkSession()
  const [from, setFrom] = useState(DEFAULT_PERIOD.from)
  const [to, setTo] = useState(DEFAULT_PERIOD.to)

  const records = useMemo(
    () => filterUsageHistory(USAGE_HISTORY.filter((record) => record.machineId === machine.id), { from, to }),
    [machine.id, from, to]
  )

  const canActivate = machine.status === 'disponivel' && !session

  const activate = () => {
    start(machine.id)
    navigate('/funcionario/sessao')
  }

  const formatDate = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  return (
    <BottomSheet
      open
      title={t('employee.detail.title')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={`${styles.footerButton} ${styles.cancel}`} onClick={onClose}>
            {t('employee.detail.cancel')}
          </button>
          <button
            type="button"
            className={`${styles.footerButton} ${styles.activate}`}
            onClick={activate}
            disabled={!canActivate}
          >
            {t('employee.detail.activate')}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </>
      }
    >
      <div className={styles.content}>
        <div className={styles.identity}>
          <h3 className={styles.name}>{machine.nome}</h3>
          <p className={styles.meta}>
            {t('employee.detail.mac')}: {machine.dispositivoConectado.enderecoMac}
          </p>
          <p className={styles.meta}>
            {t('employee.detail.code')}: {machine.identificacao}
          </p>
        </div>

        <dl className={styles.info}>
          <div className={styles.infoRow}>
            <dt className={styles.infoLabel}>
              <MapPin size={14} aria-hidden="true" />
              {t('employee.detail.sector')}
            </dt>
            <dd className={styles.infoValue}>{machine.setor}</dd>
          </div>
          <div className={styles.infoRow}>
            <dt className={styles.infoLabel}>
              <Cpu size={14} aria-hidden="true" />
              {t('employee.detail.deviceName')}
            </dt>
            <dd className={styles.infoValue}>{machine.dispositivoConectado.nomeDispositivo}</dd>
          </div>
        </dl>

        <div className={styles.historyHeader}>
          <span className={styles.chip}>{t('employee.detail.history')}</span>
          <div className={styles.period}>
            <CalendarDays size={14} aria-hidden="true" />
            <span>{t('employee.detail.date')}:</span>
            <input
              type="date"
              className={styles.dateInput}
              aria-label={t('employee.detail.periodFrom')}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <span aria-hidden="true">-</span>
            <input
              type="date"
              className={styles.dateInput}
              aria-label={t('employee.detail.periodTo')}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>

        {records.length === 0 ? (
          <p className={styles.empty}>{t('employee.detail.historyEmpty')}</p>
        ) : (
          <ul className={styles.timeline}>
            {records.map((record) => (
              <li key={record.id} className={styles.item}>
                <span className={styles.operator}>{record.operatorName}</span>
                <span className={styles.itemMeta}>{formatDate(record.date)}</span>
                <span className={styles.itemMeta}>
                  {record.start} – {record.end} ({record.durationLabel})
                </span>
              </li>
            ))}
          </ul>
        )}

        {session && <p className={styles.hint}>{t('employee.detail.activeSessionHint')}</p>}
      </div>
    </BottomSheet>
  )
}

export default MachineDetailSheet

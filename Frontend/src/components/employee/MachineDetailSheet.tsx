import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, CalendarDays, Cpu, MapPin } from 'lucide-react'
import BottomSheet from './BottomSheet'
import Spinner from '../common/Spinner'
import type { Machine } from '../../data/machines'
import { toUsageRecord, type UsageRecord } from '../../data/employeeArea'
import { useWorkSession } from '../../hooks/useWorkSession'
import { sessionService } from '../../services/sessionService'
import { formatEventDate } from '../../utils/format'
import styles from './MachineDetailSheet.module.css'

interface MachineDetailSheetProps {
  machine: Machine
  onClose: () => void
}

const MachineDetailSheet: React.FC<MachineDetailSheetProps> = ({ machine, onClose }) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { session, start } = useWorkSession()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [records, setRecords] = useState<UsageRecord[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState(false)
  const [reloadIndex, setReloadIndex] = useState(0)
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    let stale = false
    sessionService.listar({ machineId: machine.id, from: from || undefined, to: to || undefined }).then(
      (list) => {
        if (!stale) {
          setRecords(list.map((s) => toUsageRecord(s)))
          setHistoryLoading(false)
          setHistoryError(false)
        }
      },
      () => {
        if (!stale) {
          setRecords([])
          setHistoryError(true)
          setHistoryLoading(false)
        }
      }
    )
    return () => {
      stale = true
    }
  }, [machine.id, from, to, reloadIndex])

  const canActivate = machine.status === 'disponivel' && !session

  const activate = async () => {
    if (!canActivate || activating) return
    setActivating(true)
    try {
      if (await start(machine.id)) {
        navigate('/funcionario/sessao')
      } else {
        setActivating(false)
      }
    } catch {
      setActivating(false)
    }
  }

  const formatDate = (date: string) => {
    try {
      return formatEventDate(date, i18n.language)
    } catch {
      return new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    }
  }

  return (
    <BottomSheet
      open
      title={t('employee.detail.title')}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className={`${styles.footerButton} ${styles.cancel}`}
            onClick={onClose}
            disabled={activating}
          >
            {t('employee.detail.cancel')}
          </button>
          <button
            type="button"
            className={`${styles.footerButton} ${styles.activate}`}
            onClick={activate}
            disabled={!canActivate || activating}
            aria-busy={activating}
          >
            {activating && <Spinner size={16} />}
            {activating ? t('employee.detail.activating') : t('employee.detail.activate')}
            {!activating && <ArrowRight size={16} aria-hidden="true" />}
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
              onChange={(event) => {
                setFrom(event.target.value)
                setHistoryLoading(true)
                setHistoryError(false)
              }}
            />
            <span aria-hidden="true">-</span>
            <input
              type="date"
              className={styles.dateInput}
              aria-label={t('employee.detail.periodTo')}
              value={to}
              onChange={(event) => {
                setTo(event.target.value)
                setHistoryLoading(true)
                setHistoryError(false)
              }}
            />
          </div>
        </div>

        <div className={styles.historyContainer} aria-busy={historyLoading}>
          {historyLoading ? (
            <div className={styles.historySkeleton} data-testid="history-skeleton">
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
              <div className={styles.skeletonLine} />
            </div>
          ) : historyError ? (
            <div className={styles.historyError}>
              <p className={styles.errorText}>{t('employee.detail.historyError')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => {
                  setHistoryLoading(true)
                  setHistoryError(false)
                  setReloadIndex((i) => i + 1)
                }}
              >
                {t('employee.detail.historyRetry')}
              </button>
            </div>
          ) : records.length === 0 ? (
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
        </div>

        {session && <p className={styles.hint}>{t('employee.detail.activeSessionHint')}</p>}
      </div>
    </BottomSheet>
  )
}

export default MachineDetailSheet

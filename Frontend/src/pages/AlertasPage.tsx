import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Calendar, Search } from 'lucide-react'
import PageSkeleton from '../components/common/PageSkeleton'
import FleetCard from '../components/fleet/FleetCard'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import { useFirstVisitLoading } from '../hooks/useFirstVisitLoading'
import {
  ACCIDENT_URGENCY,
  DEFAULT_PERIOD,
  MACHINES,
  MACHINE_EVENTS,
  eventsForMachine,
  filterEvents,
} from '../data/machines'
import styles from './AlertasPage.module.css'

const MACHINE_BY_ID = new Map(MACHINES.map((machine) => [machine.id, machine]))

const AlertasPage: React.FC = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState(DEFAULT_PERIOD.from)
  const [to, setTo] = useState(DEFAULT_PERIOD.to)
  const [detailId, setDetailId] = useState<string | null>(null)
  const loading = useFirstVisitLoading('alertas')

  const alerts = useMemo(() => {
    const text = query.trim().toLowerCase()
    return filterEvents(MACHINE_EVENTS, { tipo: 'acidente', from, to }).flatMap((event) => {
      const machine = MACHINE_BY_ID.get(event.machineId)
      const matches =
        machine && (machine.nome.toLowerCase().includes(text) || machine.identificacao.toLowerCase().includes(text))
      return matches ? [{ event, machine }] : []
    })
  }, [query, from, to])

  const detailMachine = detailId ? MACHINE_BY_ID.get(detailId) : undefined

  if (loading) {
    return (
      <div className={styles.page}>
        <PageSkeleton variant="grid" gridClassName={styles.grid} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <h2 className={styles.label}>
            <AlertTriangle size={14} aria-hidden="true" />
            {t('alerts.accidents')}
            <span className={styles.count} data-testid="alerts-count">
              {alerts.length}
            </span>
          </h2>

          <div className={styles.filters}>
            <div className={styles.searchField}>
              <Search size={14} className={styles.searchIcon} aria-hidden="true" />
              <input
                type="search"
                className={styles.searchInput}
                placeholder={t('alerts.searchPlaceholder')}
                aria-label={t('alerts.searchPlaceholder')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
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
        </div>

        {alerts.length === 0 ? (
          <p className={styles.empty}>{t('alerts.empty')}</p>
        ) : (
          <div className={styles.grid}>
            {alerts.map(({ event, machine }) => (
              <FleetCard
                key={event.id}
                kind="acidentes"
                // "Funcionário" do alerta é quem operava no acidente, não o operador conectado agora.
                machine={{ ...machine, operadorConectado: { nome: event.operador } }}
                lastAccident={{ data: event.data, hora: event.inicio }}
                urgency={event.causa && ACCIDENT_URGENCY[event.causa]}
                onOpen={() => setDetailId(machine.id)}
              />
            ))}
          </div>
        )}
      </section>

      {detailMachine && (
        <MachineDetailModal
          variant="alerts"
          machine={detailMachine}
          events={eventsForMachine(detailMachine.id)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}

export default AlertasPage

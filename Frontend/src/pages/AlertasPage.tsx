import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Calendar, Search } from 'lucide-react'
import PageSkeleton, { SkeletonBlock } from '../components/common/PageSkeleton'
import FleetCard from '../components/fleet/FleetCard'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import { useFirstVisitLoading } from '../hooks/useFirstVisitLoading'
import {
  DEFAULT_PERIOD,
  MACHINES,
  defaultPeriodTo,
  eventUrgency,
  eventsForMachine,
  incidentToEvent,
  type Machine,
  type MachineEvent,
} from '../data/machines'
import { incidentService } from '../services/incidentService'
import { machineService } from '../services/machineService'
import styles from './AlertasPage.module.css'

// ponytail: repairs are still mock; matched by identificacao because API ids are ObjectId (same as FrotaPage).
const repairsFor = (machine: Machine) =>
  eventsForMachine(MACHINES.find((item) => item.identificacao === machine.identificacao)?.id ?? '')

const AlertasPage: React.FC = () => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState(DEFAULT_PERIOD.from)
  const [to, setTo] = useState(defaultPeriodTo)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [machines, setMachines] = useState<Machine[]>([])
  const [events, setEvents] = useState<MachineEvent[]>([])
  const loading = useFirstVisitLoading('alertas')

  useEffect(() => {
    let stale = false
    machineService.listar().then((list) => !stale && setMachines(list), () => {})
    return () => {
      stale = true
    }
  }, [])

  useEffect(() => {
    let stale = false
    incidentService.listar({ from: from || undefined, to: to || undefined }).then(
      (list) => !stale && setEvents(list.map(incidentToEvent)),
      () => !stale && setEvents([])
    )
    return () => {
      stale = true
    }
  }, [from, to])

  const machineById = useMemo(() => new Map(machines.map((machine) => [machine.id, machine])), [machines])

  const alerts = useMemo(() => {
    const text = query.trim().toLowerCase()
    return events.flatMap((event) => {
      const machine = machineById.get(event.machineId)
      const matches =
        machine && (machine.nome.toLowerCase().includes(text) || machine.identificacao.toLowerCase().includes(text))
      return matches ? [{ event, machine }] : []
    })
  }, [query, events, machineById])

  const detailMachine = detailId ? machineById.get(detailId) : undefined

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.panel}>
          <PageSkeleton variant="grid" card="fleet" gridClassName={styles.grid}>
            <div className={styles.toolbar} data-skeleton-toolbar>
              <SkeletonBlock className={styles.labelSkeleton} />
              <div className={styles.filters}>
                <SkeletonBlock className={styles.searchSkeleton} />
                <SkeletonBlock className={styles.periodSkeleton} />
              </div>
            </div>
          </PageSkeleton>
        </div>
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
              <Search size={16} className={styles.searchIcon} aria-hidden="true" />
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
              <Calendar size={14} className={styles.periodIcon} aria-hidden="true" />
              <input
                type="date"
                className={styles.dateInput}
                aria-label={t('machines.periodFrom')}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
              <span aria-hidden="true" className={styles.periodSeparator}>
                –
              </span>
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
                // "Funcionário" do alerta é quem operava no acidente, não o operador conectado agora.
                machine={{ ...machine, operadorConectado: { nome: event.operador } }}
                incident={{ data: event.data, hora: event.inicio, urgency: eventUrgency(event) }}
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
          events={repairsFor(detailMachine)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
}

export default AlertasPage

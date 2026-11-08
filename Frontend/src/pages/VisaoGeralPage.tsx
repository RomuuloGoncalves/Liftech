import React, { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Copy, MapPin } from 'lucide-react'
import MachineCard from '../components/machines/MachineCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PageSkeleton, { SkeletonBlock } from '../components/common/PageSkeleton'
import Select from '../components/common/Select'
import { useToast } from '../components/common/Toast'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import NewMachinePanel, { type NewMachineFormValues } from '../components/machines/NewMachinePanel'
import { useActiveBranch } from '../context/ActiveBranchContext'
import { useLive } from '../context/LiveContext'
import { machineService } from '../services/machineService'
import { sectorService, type Setor } from '../services/sectorService'
import {
  MACHINE_STATUSES,
  filterMachines,
  type Machine,
  type MachineStatus,
} from '../data/machines'
import styles from './VisaoGeralPage.module.css'

export interface MaquinaStreamEvento {
  id: string
  filialId?: string
  status?: MachineStatus
  categoriaId?: string | null
  categoriaTravada?: boolean
  alertaEm?: string | null
  alertaTipos?: string[]
  dispositivoOffline?: boolean
}

type StatusFilter = MachineStatus | 'Todos'
type LoadState = 'loading' | 'ready' | 'error'

const VisaoGeralPage: React.FC = () => {
  const { t } = useTranslation()
  const [allMachines, setAllMachines] = useState<Machine[]>([])
  const [sectors, setSectors] = useState<Setor[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('Todos')
  const [sectorFilter, setSectorFilter] = useState('Todos')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [subDialog, setSubDialog] = useState<'edit' | 'delete' | null>(null)
  const [deletingMachine, setDeletingMachine] = useState(false)
  const { show, showError } = useToast()
  const { activeBranch, branches } = useActiveBranch()
  const filialId = activeBranch === 'todas' ? undefined : activeBranch
  const [loadedFilialId, setLoadedFilialId] = useState(filialId)
  const [attempt, setAttempt] = useState(0)

  // Filial ativa diferente volta ao skeleton antes de buscar novamente.
  if (loadedFilialId !== filialId) {
    setLoadedFilialId(filialId)
    setLoadState('loading')
    setSectorFilter('Todos')
  }

  useEffect(() => {
    let stale = false
    // Sem setores a página ainda funciona: o select oferece apenas "Sem setor".
    Promise.all([machineService.listar(filialId), sectorService.listar(filialId).catch(() => [])]).then(
      ([machines, sectorList]) => {
        if (stale) return
        setAllMachines(machines)
        setSectors(sectorList)
        setLoadState('ready')
      },
      () => {
        if (!stale) setLoadState('error')
      }
    )
    return () => {
      stale = true
    }
  }, [filialId, attempt])

  const retry = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  const handleLiveMaquina = useCallback(
    (evento: MaquinaStreamEvento) => {
      if (filialId && evento.filialId && evento.filialId !== filialId) {
        return
      }

      const exists = allMachines.some((m) => m.id === evento.id)
      if (!exists) {
        retry()
        return
      }

      setAllMachines((prev) =>
        prev.map((m) => {
          if (m.id !== evento.id) return m
          return {
            ...m,
            status: evento.status ?? m.status,
            categoriaId:
              evento.categoriaId !== undefined ? evento.categoriaId : m.categoriaId,
            categoriaTravada:
              evento.categoriaTravada !== undefined
                ? evento.categoriaTravada
                : m.categoriaTravada,
            alertaEm: evento.alertaEm !== undefined ? evento.alertaEm : m.alertaEm,
            alertaTipos:
              evento.alertaTipos !== undefined ? evento.alertaTipos : m.alertaTipos,
            dispositivoOffline:
              evento.dispositivoOffline !== undefined
                ? evento.dispositivoOffline
                : m.dispositivoOffline,
          }
        })
      )
    },
    [filialId, allMachines, retry]
  )

  useLive<MaquinaStreamEvento>('maquina', handleLiveMaquina, retry)

  const detailMachine = allMachines.find((machine) => machine.id === detailId)

  const machines = useMemo(
    () => filterMachines(allMachines, { query, status, setorId: sectorFilter }),
    [allMachines, query, status, sectorFilter]
  )
  // Nomes se repetem entre filiais: com mais de uma filial na tela a opção também inclui o nome da filial.
  const sectorLabel = (sector: Setor) =>
    activeBranch === 'todas' && branches.length > 1 ? `${sector.nome} · ${sector.filial.nome}` : sector.nome

  const handleCreateMachine = async (values: NewMachineFormValues) => {
    try {
      const saved = await machineService.criar(values, values.filialId ?? filialId)
      setAllMachines((prev) => [saved, ...prev])
      show(t('machines.toastCreated', { name: values.identificacao }))
    } catch (e) {
      showError(t('machines.saveError'))
      throw e
    }
  }

  const handleEditMachine = async (values: NewMachineFormValues) => {
    if (!detailMachine) return
    try {
      const saved = await machineService.atualizar(detailMachine.id, values)
      setAllMachines((prev) => prev.map((m) => (m.id === detailMachine.id ? saved : m)))
      show(t('machines.toastSaved', { name: values.identificacao }))
    } catch (e) {
      showError(t('machines.saveError'))
      throw e
    }
  }

  const handleDeleteMachine = async () => {
    if (!detailMachine || deletingMachine) return
    setDeletingMachine(true)
    try {
      await machineService.remover(detailMachine.id)
      setAllMachines((prev) => prev.filter((machine) => machine.id !== detailMachine.id))
      setSubDialog(null)
      setDetailId(null)
      show(t('machines.toastDeleted', { name: detailMachine.identificacao }))
    } catch (e) {
      showError(
        t(axios.isAxiosError(e) && e.response?.status === 409 ? 'machines.deleteInSession' : 'machines.saveError')
      )
    } finally {
      setDeletingMachine(false)
    }
  }

  const handleModalChangeStatus = (next: MachineStatus): Promise<Machine | undefined> => {
    if (!detailMachine) return Promise.resolve(undefined)
    const previous = detailMachine
    const optimistic: Machine = { ...previous, status: next }
    setAllMachines((prev) => prev.map((m) => (m.id === previous.id ? optimistic : m)))
    const promise = (async () => {
      try {
        const saved = await machineService.alterarStatus(detailMachine.id, next)
        setAllMachines((prev) => prev.map((m) => (m.id === previous.id ? saved : m)))
        return saved
      } catch (e) {
        setAllMachines((prev) => prev.map((m) => (m.id === previous.id ? previous : m)))
        throw e
      }
    })()
    promise.catch(() => {})
    return promise
  }

  const handleModalToggleLock = (valor: boolean): Promise<Machine | undefined> => {
    if (!detailMachine) return Promise.resolve(undefined)
    const previous = detailMachine
    const optimistic: Machine = { ...previous, categoriaTravada: valor }
    setAllMachines((prev) => prev.map((m) => (m.id === previous.id ? optimistic : m)))
    const promise = (async () => {
      try {
        const saved = await machineService.travar(detailMachine.id, valor)
        setAllMachines((prev) => prev.map((m) => (m.id === previous.id ? saved : m)))
        return saved
      } catch (e) {
        setAllMachines((prev) => prev.map((m) => (m.id === previous.id ? previous : m)))
        throw e
      }
    })()
    promise.catch(() => {})
    return promise
  }

  if (loadState === 'loading') {
    return (
      <div className={styles.page}>
        <PageSkeleton variant="grid" gridClassName={styles.grid}>
          <div className={styles.toolbar} data-skeleton-toolbar>
            <SkeletonBlock className={styles.searchSkeleton} />
            <SkeletonBlock className={styles.selectSkeleton} />
            <SkeletonBlock className={styles.selectSkeleton} />
            <SkeletonBlock className={styles.buttonSkeleton} />
          </div>
        </PageSkeleton>
      </div>
    )
  }

  if (loadState === 'error') {
    return (
      <div className={styles.page}>
        <div role="alert" className={styles.errorState}>
          <p>{t('machines.loadError')}</p>
          <button
            type="button"
            className={styles.registerButton}
            onClick={() => {
              setLoadState('loading')
              retry()
            }}
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>

        <div className={styles.searchField}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder={t('machines.searchPlaceholder')}
            aria-label="Buscar máquina por identificação ou setor"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className={styles.selectWrapper}>
          <Copy size={16} className={styles.selectLeftIcon} aria-hidden="true" />

          <Select
            className={styles.selectContainer}
            buttonClassName={styles.statusSelect}
            ariaLabel="Filtrar máquinas por status"
            value={status}
            onChange={(val) => setStatus(val as StatusFilter)}
            options={[
              { value: 'Todos', label: t('machines.filterDefault') },
              ...MACHINE_STATUSES.map((option) => ({
                value: option,
                label: t(`machines.status.${option}`),
              })),
            ]}
          />
        </div>

        <div className={styles.selectWrapper}>
          <MapPin size={16} className={styles.selectLeftIcon} aria-hidden="true" />
          <Select
            className={styles.selectContainer}
            buttonClassName={styles.statusSelect}
            ariaLabel={t('machines.filterSectorLabel')}
            value={sectorFilter}
            onChange={(val) => setSectorFilter(val)}
            options={[
              { value: 'Todos', label: t('machines.filterSectorAll') },
              ...sectors.map((sector) => ({
                value: sector._id,
                label: sectorLabel(sector),
              })),
            ]}
          />
        </div>

        <button type="button" className={styles.registerButton} onClick={() => setIsPanelOpen(true)}>
          <Plus size={16} />
          {t('machines.registerButton')}
        </button>
      </div>

      {machines.length === 0 ? (
        <p className={styles.emptyState}>{t('machines.emptyState')}</p>
      ) : (
        <div className={styles.grid}>
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} onOpen={(item) => setDetailId(item.id)} />
          ))}
        </div>
      )}

      {isPanelOpen && (
        <NewMachinePanel
          branches={activeBranch === 'todas' ? branches : undefined}
          sectors={sectors}
          defaultFilialId={filialId}
          onClose={() => setIsPanelOpen(false)}
          onCreate={handleCreateMachine}
        />
      )}

      {detailMachine && subDialog === null && (
        <MachineDetailModal
          machine={detailMachine}
          onEdit={() => setSubDialog('edit')}
          onDelete={() => setSubDialog('delete')}
          onChangeStatus={handleModalChangeStatus}
          onToggleLock={handleModalToggleLock}
          onClose={() => setDetailId(null)}
        />
      )}
      {detailMachine && subDialog === 'edit' && (
        <NewMachinePanel
          machine={detailMachine}
          sectors={sectors}
          defaultFilialId={filialId}
          onClose={() => setSubDialog(null)}
          onCreate={handleEditMachine}
        />
      )}
      {detailMachine && subDialog === 'delete' && (
        <ConfirmDialog
          title={t('machines.deleteMachineTitle')}
          message={t('machines.deleteMachineMessage', { name: `${detailMachine.nome} (${detailMachine.identificacao})` })}
          onConfirm={handleDeleteMachine}
          onCancel={() => setSubDialog(null)}
          busy={deletingMachine}
        />
      )}
    </div>
  )
}

export default VisaoGeralPage

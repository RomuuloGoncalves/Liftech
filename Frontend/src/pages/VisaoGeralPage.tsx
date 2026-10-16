import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Copy, MapPin } from 'lucide-react'
import MachineCard from '../components/machines/MachineCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PageSkeleton, { SkeletonBlock } from '../components/common/PageSkeleton'
import { useToast } from '../components/common/Toast'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import NewMachinePanel, { type NewMachineFormValues } from '../components/machines/NewMachinePanel'
import { useActiveBranch } from '../context/ActiveBranchContext'
import { machineService } from '../services/machineService'
import { sectorService, type Setor } from '../services/sectorService'
import {
  MACHINES,
  MACHINE_STATUSES,
  eventsForMachine,
  filterMachines,
  type Machine,
  type MachineStatus,
} from '../data/machines'
import styles from './VisaoGeralPage.module.css'

type StatusFilter = MachineStatus | 'Todos'
type LoadState = 'loading' | 'ready' | 'error'

// ponytail: o histórico do detalhe ainda é mock (não há rota de incident); casa pela identificacao porque os ids da API são ObjectId.
const mockEventsFor = (machine: Machine) =>
  eventsForMachine(MACHINES.find((item) => item.identificacao === machine.identificacao)?.id ?? '')

// Id da máquina recém-cadastrada até a API responder com o id de verdade.
let nextTempId = 0

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
  const { show, showError } = useToast()
  const { activeBranch, branches } = useActiveBranch()
  const filialId = activeBranch === 'todas' ? undefined : activeBranch
  const [loadedFilialId, setLoadedFilialId] = useState(filialId)
  const [attempt, setAttempt] = useState(0)

  // A different active branch goes back to the skeleton before the effect refetches.
  if (loadedFilialId !== filialId) {
    setLoadedFilialId(filialId)
    setLoadState('loading')
    setSectorFilter('Todos')
  }

  useEffect(() => {
    let stale = false
    // Without sectors the page still works: the select only offers "Sem setor".
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

  const retry = () => {
    setLoadState('loading')
    setAttempt((value) => value + 1)
  }

  const detailMachine = allMachines.find((machine) => machine.id === detailId)

  const machines = useMemo(
    () => filterMachines(allMachines, { query, status, setorId: sectorFilter }),
    [allMachines, query, status, sectorFilter]
  )
  // Names repeat across branches: with more than one branch on screen the option names the branch too.
  const sectorLabel = (sector: Setor) =>
    activeBranch === 'todas' && branches.length > 1 ? `${sector.nome} · ${sector.filial.nome}` : sector.nome

  // Otimista: troca a máquina na lista, grava e usa a resposta; em falha volta a anterior.
  const saveOptimistic = (previous: Machine, next: Machine, save: () => Promise<Machine>, errorKey: string) => {
    const replace = (machine: Machine) =>
      setAllMachines((prev) => prev.map((item) => (item.id === previous.id ? machine : item)))
    replace(next)
    save().then(replace, () => {
      replace(previous)
      showError(t(errorKey))
    })
  }

  const sectorName = (setorId: string) => sectors.find((sector) => sector._id === setorId)?.nome ?? ''

  const handleCreateMachine = (values: NewMachineFormValues) => {
    const temp: Machine = {
      id: `temp-${nextTempId++}`,
      identificacao: values.identificacao,
      nome: values.nome,
      setor: sectorName(values.setorId),
      setorId: values.setorId || null,
      status: 'disponivel',
      categoriaId: null,
      categoriaTravada: false,
      alertaEm: null,
      dispositivoConectado: {
        enderecoMac: values.enderecoMac,
        nomeDispositivo: values.nomeDispositivo,
      },
      tempoSessaoMinutos: 0,
      tempoUsoTotalHoras: 0,
    }
    setAllMachines((prev) => [temp, ...prev])
    setIsPanelOpen(false)
    show(t('machines.toastCreated', { name: values.identificacao }))
    machineService.criar(values, values.filialId ?? filialId).then(
      (saved) => setAllMachines((prev) => prev.map((machine) => (machine.id === temp.id ? saved : machine))),
      () => {
        setAllMachines((prev) => prev.filter((machine) => machine.id !== temp.id))
        showError(t('machines.saveError'))
      }
    )
  }

  const handleEditMachine = (values: NewMachineFormValues) => {
    if (!detailMachine) return
    const edited: Machine = {
      ...detailMachine,
      nome: values.nome,
      identificacao: values.identificacao,
      setor: sectorName(values.setorId),
      setorId: values.setorId || null,
      dispositivoConectado: {
        ...detailMachine.dispositivoConectado,
        enderecoMac: values.enderecoMac,
        nomeDispositivo: values.nomeDispositivo,
      },
    }
    saveOptimistic(detailMachine, edited, () => machineService.atualizar(detailMachine.id, values), 'machines.saveError')
    setSubDialog(null)
    show(t('machines.toastSaved', { name: values.identificacao }))
  }

  const handleDeleteMachine = () => {
    if (!detailMachine) return
    const removed = detailMachine
    const index = allMachines.indexOf(removed)
    setAllMachines((prev) => prev.filter((machine) => machine.id !== removed.id))
    setSubDialog(null)
    setDetailId(null)
    show(t('machines.toastDeleted', { name: removed.identificacao }))
    machineService.remover(removed.id).catch((e) => {
      setAllMachines((prev) => [...prev.slice(0, index), removed, ...prev.slice(index)])
      showError(
        t(axios.isAxiosError(e) && e.response?.status === 409 ? 'machines.deleteInSession' : 'machines.saveError')
      )
    })
  }

  const updateMachine = (patch: Partial<Machine>, save: (id: string) => Promise<Machine>) => {
    if (!detailMachine) return
    saveOptimistic(detailMachine, { ...detailMachine, ...patch }, () => save(detailMachine.id), 'fleet.saveError')
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
          <button type="button" className={styles.registerButton} onClick={retry}>
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

          <select
            className={styles.statusSelect}
            aria-label="Filtrar máquinas por status"
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
          >
            <option value="Todos">{t('machines.filterDefault')}</option>
            {MACHINE_STATUSES.map((option) => (
              <option key={option} value={option}>
                {t(`machines.status.${option}`)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.selectWrapper}>
          <MapPin size={16} className={styles.selectLeftIcon} aria-hidden="true" />
          <select
            className={styles.statusSelect}
            aria-label={t('machines.filterSectorLabel')}
            value={sectorFilter}
            onChange={(event) => setSectorFilter(event.target.value)}
          >
            <option value="Todos">{t('machines.filterSectorAll')}</option>
            {sectors.map((sector) => (
              <option key={sector._id} value={sector._id}>
                {sectorLabel(sector)}
              </option>
            ))}
          </select>
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
          events={mockEventsFor(detailMachine)}
          onEdit={() => setSubDialog('edit')}
          onDelete={() => setSubDialog('delete')}
          onChangeStatus={(next) => updateMachine({ status: next }, (id) => machineService.alterarStatus(id, next))}
          onToggleLock={(valor) =>
            updateMachine({ categoriaTravada: valor }, (id) => machineService.travar(id, valor))
          }
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
        />
      )}
    </div>
  )
}

export default VisaoGeralPage

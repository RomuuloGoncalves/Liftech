import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Copy } from 'lucide-react'
import MachineCard from '../components/machines/MachineCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PageSkeleton, { SkeletonBlock } from '../components/common/PageSkeleton'
import { useToast } from '../components/common/Toast'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import NewMachinePanel, { type NewMachineFormValues } from '../components/machines/NewMachinePanel'
import { useActiveBranch } from '../context/ActiveBranchContext'
import { machineService } from '../services/machineService'
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

let nextMachineId = MACHINES.length + 1

const VisaoGeralPage: React.FC = () => {
  const { t } = useTranslation()
  const [allMachines, setAllMachines] = useState<Machine[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('Todos')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [subDialog, setSubDialog] = useState<'edit' | 'delete' | null>(null)
  const { show, showError } = useToast()
  const { activeBranch } = useActiveBranch()
  const filialId = activeBranch === 'todas' ? undefined : activeBranch
  const [loadedFilialId, setLoadedFilialId] = useState(filialId)
  const [attempt, setAttempt] = useState(0)

  // A different active branch goes back to the skeleton before the effect refetches.
  if (loadedFilialId !== filialId) {
    setLoadedFilialId(filialId)
    setLoadState('loading')
  }

  useEffect(() => {
    let stale = false
    machineService.listar(filialId).then(
      (machines) => {
        if (stale) return
        setAllMachines(machines)
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

  const machines = useMemo(() => filterMachines(allMachines, { query, status }), [allMachines, query, status])

  const handleCreateMachine = (values: NewMachineFormValues) => {
    const newMachine: Machine = {
      id: String(nextMachineId++),
      identificacao: values.identificacao,
      nome: values.nome,
      setor: values.setor,
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
    setAllMachines((prev) => [newMachine, ...prev])
    setIsPanelOpen(false)
    show(t('machines.toastCreated', { name: values.identificacao }))
  }

  const handleEditMachine = (values: NewMachineFormValues) => {
    setAllMachines((prev) =>
      prev.map((machine) =>
        machine.id === detailId
          ? {
              ...machine,
              nome: values.nome,
              identificacao: values.identificacao,
              setor: values.setor,
              dispositivoConectado: {
                ...machine.dispositivoConectado,
                enderecoMac: values.enderecoMac,
                nomeDispositivo: values.nomeDispositivo,
              },
            }
          : machine
      )
    )
    setSubDialog(null)
    show(t('machines.toastSaved', { name: values.identificacao }))
  }

  const handleDeleteMachine = () => {
    setAllMachines((prev) => prev.filter((machine) => machine.id !== detailId))
    setSubDialog(null)
    setDetailId(null)
    if (detailMachine) show(t('machines.toastDeleted', { name: detailMachine.identificacao }))
  }

  // Otimista: aplica o patch, grava e usa a resposta; em falha volta a máquina anterior.
  const updateMachine = (patch: Partial<Machine>, save: (id: string) => Promise<Machine>) => {
    if (!detailMachine) return
    const previous = detailMachine
    const replace = (next: Machine) =>
      setAllMachines((prev) => prev.map((machine) => (machine.id === previous.id ? next : machine)))
    replace({ ...previous, ...patch })
    save(previous.id).then(replace, () => {
      replace(previous)
      showError(t('fleet.saveError'))
    })
  }

  if (loadState === 'loading') {
    return (
      <div className={styles.page}>
        <PageSkeleton variant="grid" gridClassName={styles.grid}>
          <div className={styles.toolbar} data-skeleton-toolbar>
            <SkeletonBlock className={styles.searchSkeleton} />
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
        <NewMachinePanel onClose={() => setIsPanelOpen(false)} onCreate={handleCreateMachine} />
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
        <NewMachinePanel machine={detailMachine} onClose={() => setSubDialog(null)} onCreate={handleEditMachine} />
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

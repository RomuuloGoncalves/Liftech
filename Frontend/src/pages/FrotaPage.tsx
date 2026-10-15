import React, { useEffect, useRef, useState } from 'react'
import { CirclePlus, Plus, Search, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PageSkeleton, { SkeletonBlock } from '../components/common/PageSkeleton'
import { useToast } from '../components/common/Toast'
import CategoryFormModal from '../components/fleet/CategoryFormModal'
import FleetCard from '../components/fleet/FleetCard'
import FleetRow from '../components/fleet/FleetRow'
import MachinePickerModal from '../components/fleet/MachinePickerModal'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import { useActiveBranch } from '../context/ActiveBranchContext'
import {
  addMachines,
  deleteCategory,
  matchesMachine,
  montarQuadro,
  moveMachine,
  removeMachine,
  unassignedMachines,
  type CategoryKey,
  type FleetCategory,
} from '../data/fleet'
import { MACHINES, eventsForMachine, type Machine } from '../data/machines'
import { authService } from '../services/authService'
import { categoryService, type Categoria } from '../services/categoryService'
import { machineService } from '../services/machineService'
import styles from './FrotaPage.module.css'

type Dialog =
  | { type: 'form'; categoryId?: string }
  | { type: 'add'; categoryId: string }
  | { type: 'delete'; categoryId: string }
  | { type: 'detail'; machineId: string }
  | null

type LoadState = 'loading' | 'ready' | 'error'

const LABEL_KEYS: Record<CategoryKey, string> = {
  acidentes: 'fleet.categoryAcidentes',
  ativas: 'fleet.categoryAtivas',
  manutencao: 'fleet.categoryManutencao',
  disponiveis: 'fleet.categoryDisponiveis',
}

// ponytail: o histórico do detalhe ainda é mock (não há rota de incident); casa pela identificacao porque os ids da API são ObjectId.
const mockEventsFor = (machine: Machine) =>
  eventsForMachine(MACHINES.find((item) => item.identificacao === machine.identificacao)?.id ?? '')

const ARRIVE_MS = 1000
const rowOf = (categoria: Categoria) => montarQuadro([categoria], [])[0]

const FrotaPage: React.FC = () => {
  const { t } = useTranslation()
  const [board, setBoard] = useState<FleetCategory[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const { activeBranch } = useActiveBranch()
  const filialId = activeBranch === 'todas' ? undefined : activeBranch
  const [loadedFilialId, setLoadedFilialId] = useState(filialId)
  const [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overRowId, setOverRowId] = useState<string | null>(null)
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(() => new Set())
  const arriveTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const { show, showError } = useToast()

  // Outra filial volta ao skeleton antes do efeito buscar de novo.
  if (loadedFilialId !== filialId) {
    setLoadedFilialId(filialId)
    setLoadState('loading')
  }

  useEffect(() => {
    let stale = false
    Promise.all([categoryService.listar(), machineService.listar(filialId)]).then(
      ([categorias, maquinas]) => {
        if (stale) return
        setMachines(maquinas)
        setBoard(montarQuadro(categorias, maquinas))
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

  // Só o escopo empresa cria, edita e exclui categorias (o backend responde 403 para filiais).
  const canManage = authService.getSession()?.escopo === 'empresa'
  const openForm = (categoryId?: string) => setDialog({ type: 'form', categoryId })
  const machinesById = new Map(machines.map((m) => [m.id, m]))

  useEffect(() => {
    const timers = arriveTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const labelOf = (category: FleetCategory) => (category.chave ? t(LABEL_KEYS[category.chave]) : category.nome)
  const close = () => setDialog(null)
  const visibleRows = categoryFilter === 'all' ? board : board.filter((c) => c.id === categoryFilter)

  const sourceRowId = draggingId ? board.find((c) => c.machineIds.includes(draggingId))?.id : undefined

  /** Destaca por 1 s os cards que acabaram de entrar numa linha. */
  const markArrived = (ids: string[]) => {
    setArrivedIds((prev) => new Set([...prev, ...ids]))
    arriveTimers.current.push(
      setTimeout(() => setArrivedIds((prev) => new Set([...prev].filter((id) => !ids.includes(id)))), ARRIVE_MS)
    )
  }

  /** Aplica na hora, chama a API e volta ao estado anterior com aviso se falhar (MOV-07, MOV-08). */
  const persist = (apply: () => void, call: () => Promise<unknown>) => {
    const before = { board, machines }
    apply()
    call().catch(() => {
      setBoard(before.board)
      setMachines(before.machines)
      showError(t('fleet.saveError'))
    })
  }

  const setCategoriaLocal = (ids: string[], categoriaId: string | null) =>
    setMachines((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, categoriaId } : m)))

  const replaceMachine = (next: Machine) => setMachines((prev) => prev.map((m) => (m.id === next.id ? next : m)))

  const updateMachine = (machine: Machine, patch: Partial<Machine>, save: () => Promise<Machine>) =>
    persist(
      () => replaceMachine({ ...machine, ...patch }),
      () =>
        save().then((saved) => {
          replaceMachine(saved)
          // O backend decide a troca automática de categoria (AUT-01..03): segue o que ele devolveu.
          if (saved.categoriaId !== machine.categoriaId) {
            const exists = board.some((c) => c.id === saved.categoriaId)
            setBoard((prev) => (exists ? moveMachine(prev, saved.id, saved.categoriaId!) : removeMachine(prev, saved.id)))
            if (exists) markArrived([saved.id])
          }
        })
    )

  const moveTo = (machineId: string, categoryId: string) => {
    persist(
      () => {
        setBoard((prev) => moveMachine(prev, machineId, categoryId))
        setCategoriaLocal([machineId], categoryId)
      },
      () => machineService.mover([machineId], categoryId)
    )
    markArrived([machineId])
  }

  const endDrag = () => {
    setDraggingId(null)
    setOverRowId(null)
  }

  const handleDrop = (categoryId: string) => {
    if (draggingId && categoryId !== sourceRowId) moveTo(draggingId, categoryId)
    endDrag()
  }

  const renderCard = (category: FleetCategory) => (machine: Machine) => (
    <FleetCard
      key={machine.id}
      machine={machine}
      moveTargets={board.filter((c) => c.id !== category.id).map((c) => ({ id: c.id, nome: labelOf(c) }))}
      onOpen={(item) => setDialog({ type: 'detail', machineId: item.id })}
      onDragStart={setDraggingId}
      onMove={moveTo}
      onToggleLock={(id) =>
        updateMachine(machine, { categoriaTravada: false }, () => machineService.travar(id, false))
      }
      onRemove={(id) => {
        persist(
          () => {
            setBoard((prev) => removeMachine(prev, id))
            setCategoriaLocal([id], null)
          },
          () => machineService.mover([id], null)
        )
        show(t('fleet.toastMachineRemoved', { name: machinesById.get(id)?.identificacao }))
      }}
      isDragging={draggingId === machine.id}
      isArriving={arrivedIds.has(machine.id)}
    />
  )

  const editing = dialog?.type === 'form' && dialog.categoryId ? board.find((c) => c.id === dialog.categoryId) : undefined
  const deleting = dialog?.type === 'delete' ? board.find((c) => c.id === dialog.categoryId) : undefined
  const detail = dialog?.type === 'detail' ? machinesById.get(dialog.machineId) : undefined

  if (loadState === 'loading') {
    return (
      <div className={styles.page}>
        <PageSkeleton variant="kanban">
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
          <button type="button" className={styles.createButton} onClick={retry}>
            {t('common.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page} onDragEnd={endDrag}>
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder={t('machines.searchPlaceholder')}
            aria-label={t('common.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className={styles.selectWrapper}>
          <Copy size={16} className={styles.selectLeftIcon} aria-hidden="true" />
          <select
            className={styles.filter}
            aria-label={t('fleet.filterLabel')}
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="all">{t('fleet.filterAll')}</option>
            {board.map((category) => (
              <option key={category.id} value={category.id}>
                {labelOf(category)}
              </option>
            ))}
          </select>
        </div>
        {canManage && (
          <button type="button" className={styles.createButton} onClick={() => openForm()}>
            <Plus size={16} />
            {t('fleet.createCategoryButton')}
          </button>
        )}
      </div>

      {board.length === 0 && !canManage && <p className={styles.noCategories}>{t('fleet.noCategories')}</p>}

      <div className={styles.rows}>
        {visibleRows.map((category) => (
          <FleetRow
            key={category.id}
            category={category}
            label={labelOf(category)}
            machines={category.machineIds
              .map((id) => machinesById.get(id)!)
              .filter((machine) => matchesMachine(machine, query))}
            total={category.machineIds.length}
            renderCard={renderCard(category)}
            onDrop={handleDrop}
            isDropTarget={overRowId === category.id}
            onDragOverRow={(id) => {
              if (draggingId) setOverRowId(id === sourceRowId ? null : id)
            }}
            onDragLeaveRow={(id) => setOverRowId((prev) => (prev === id ? null : prev))}
            onAdd={(categoryId) => setDialog({ type: 'add', categoryId })}
            onEdit={canManage ? openForm : undefined}
            onDelete={canManage ? (categoryId) => setDialog({ type: 'delete', categoryId }) : undefined}
          />
        ))}
      </div>

      {canManage && (
        <button
          type="button"
          className={styles.addCategory}
          aria-label={t('fleet.addCategory')}
          onClick={() => openForm()}
        >
          <CirclePlus size={18} />
        </button>
      )}

      {dialog?.type === 'form' && (
        <CategoryFormModal
          existingNames={board.filter((c) => c.id !== editing?.id).map(labelOf)}
          initial={editing && { nome: labelOf(editing), cor: editing.cor, statusVinculados: editing.statusVinculados }}
          takenStatus={board.filter((c) => c.id !== editing?.id).flatMap((c) => c.statusVinculados)}
          onSubmit={async (values) => {
            if (editing) {
              // Nome intacto não vai: renomear apaga a `chave` e perde a tradução (CAT-03).
              const { nome, ...rest } = values
              const saved = await categoryService.atualizar(editing.id, nome === labelOf(editing) ? rest : values)
              setBoard((prev) => prev.map((c) => (c.id === saved._id ? { ...rowOf(saved), machineIds: c.machineIds } : c)))
            } else {
              const saved = await categoryService.criar(values)
              setBoard((prev) => [...prev, rowOf(saved)])
              show(t('fleet.toastCategoryCreated', { name: values.nome }))
            }
            close()
          }}
          onClose={close}
        />
      )}
      {dialog?.type === 'add' && (
        <MachinePickerModal
          machines={unassignedMachines(board, machines)}
          onConfirm={(ids) => {
            const { categoryId } = dialog
            persist(
              () => {
                setBoard((prev) => addMachines(prev, categoryId, ids))
                setCategoriaLocal(ids, categoryId)
              },
              () => machineService.mover(ids, categoryId)
            )
            markArrived(ids)
            const target = board.find((c) => c.id === dialog.categoryId)
            if (target) show(t('fleet.toastMachinesAdded', { name: labelOf(target) }))
            close()
          }}
          onClose={close}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={t('fleet.deleteCategory')}
          message={t('fleet.deleteCategoryMessage', { name: labelOf(deleting) })}
          onConfirm={async () => {
            close()
            try {
              await categoryService.remover(deleting.id)
            } catch {
              showError(t('fleet.saveError'))
              return
            }
            // O backend tira as máquinas da categoria e destrava (CAT-04).
            setMachines((prev) =>
              prev.map((m) => (m.categoriaId === deleting.id ? { ...m, categoriaId: null, categoriaTravada: false } : m))
            )
            setBoard((prev) => deleteCategory(prev, deleting.id))
            show(t('fleet.toastCategoryDeleted', { name: labelOf(deleting) }))
            setCategoryFilter((prev) => (prev === deleting.id ? 'all' : prev))
          }}
          onCancel={close}
        />
      )}
      {detail && (
        <MachineDetailModal
          machine={detail}
          events={mockEventsFor(detail)}
          onClose={close}
          variant="fleet"
          onChangeStatus={(status) => updateMachine(detail, { status }, () => machineService.alterarStatus(detail.id, status))}
          onToggleLock={(valor) =>
            updateMachine(detail, { categoriaTravada: valor }, () => machineService.travar(detail.id, valor))
          }
        />
      )}
    </div>
  )
}

export default FrotaPage

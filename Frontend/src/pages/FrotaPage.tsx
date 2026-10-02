import React, { useEffect, useRef, useState } from 'react'
import { CirclePlus, Plus, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PageSkeleton from '../components/common/PageSkeleton'
import { useToast } from '../components/common/Toast'
import CategoryFormModal from '../components/fleet/CategoryFormModal'
import FleetCard from '../components/fleet/FleetCard'
import FleetRow from '../components/fleet/FleetRow'
import MachinePickerModal from '../components/fleet/MachinePickerModal'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import { useFirstVisitLoading } from '../hooks/useFirstVisitLoading'
import {
  addMachines,
  createCategory,
  deleteCategory,
  initialBoard,
  lastAccidentDate,
  matchesMachine,
  moveMachine,
  removeMachine,
  unassignedMachines,
  type CategoryKind,
  type FleetCategory,
} from '../data/fleet'
import { MACHINES, MACHINE_EVENTS, eventsForMachine, type Machine } from '../data/machines'
import styles from './FrotaPage.module.css'

type Dialog =
  | { type: 'create' }
  | { type: 'add'; categoryId: string }
  | { type: 'delete'; categoryId: string }
  | { type: 'detail'; machineId: string }
  | null

const LABEL_KEYS: Record<Exclude<CategoryKind, 'custom'>, string> = {
  acidentes: 'fleet.categoryAcidentes',
  ativas: 'fleet.categoryAtivas',
  manutencao: 'fleet.categoryManutencao',
  disponiveis: 'fleet.categoryDisponiveis',
}

const MACHINES_BY_ID = new Map(MACHINES.map((m) => [m.id, m]))
const ARRIVE_MS = 1000

const FrotaPage: React.FC = () => {
  const { t } = useTranslation()
  const [board, setBoard] = useState<FleetCategory[]>(() => initialBoard(MACHINES))
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dialog, setDialog] = useState<Dialog>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overRowId, setOverRowId] = useState<string | null>(null)
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(() => new Set())
  const arriveTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const loading = useFirstVisitLoading('frota')
  const { show } = useToast()

  useEffect(() => {
    const timers = arriveTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  const labelOf = (category: FleetCategory) => (category.kind === 'custom' ? category.nome : t(LABEL_KEYS[category.kind]))
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

  const moveTo = (machineId: string, categoryId: string) => {
    setBoard((prev) => moveMachine(prev, machineId, categoryId))
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
      kind={category.kind}
      lastAccident={category.kind === 'acidentes' ? lastAccidentDate(machine.id, MACHINE_EVENTS) : undefined}
      moveTargets={board.filter((c) => c.id !== category.id).map((c) => ({ id: c.id, nome: labelOf(c) }))}
      onOpen={(item) => setDialog({ type: 'detail', machineId: item.id })}
      onDragStart={setDraggingId}
      onMove={moveTo}
      onRemove={(id) => {
        setBoard((prev) => removeMachine(prev, id))
        show(t('fleet.toastMachineRemoved', { name: MACHINES_BY_ID.get(id)?.identificacao }))
      }}
      isDragging={draggingId === machine.id}
      isArriving={arrivedIds.has(machine.id)}
    />
  )

  const deleting = dialog?.type === 'delete' ? board.find((c) => c.id === dialog.categoryId) : undefined
  const detail = dialog?.type === 'detail' ? MACHINES_BY_ID.get(dialog.machineId) : undefined

  if (loading) {
    return (
      <div className={styles.page}>
        <PageSkeleton variant="kanban" />
      </div>
    )
  }

  return (
    <div className={styles.page} onDragEnd={endDrag}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.createButton} onClick={() => setDialog({ type: 'create' })}>
          <Plus size={16} />
          {t('fleet.createCategoryButton')}
        </button>
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

      <div className={styles.rows}>
        {visibleRows.map((category) => (
          <FleetRow
            key={category.id}
            category={category}
            label={labelOf(category)}
            machines={category.machineIds
              .map((id) => MACHINES_BY_ID.get(id)!)
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
            onDelete={(categoryId) => setDialog({ type: 'delete', categoryId })}
          />
        ))}
      </div>

      <button
        type="button"
        className={styles.addCategory}
        aria-label={t('fleet.addCategory')}
        onClick={() => setDialog({ type: 'create' })}
      >
        <CirclePlus size={18} />
      </button>

      {dialog?.type === 'create' && (
        <CategoryFormModal
          existingNames={board.map(labelOf)}
          onSubmit={(nome, cor) => {
            setBoard((prev) => createCategory(prev, nome, cor))
            show(t('fleet.toastCategoryCreated', { name: nome }))
            close()
          }}
          onClose={close}
        />
      )}
      {dialog?.type === 'add' && (
        <MachinePickerModal
          machines={unassignedMachines(board, MACHINES)}
          onConfirm={(ids) => {
            setBoard((prev) => addMachines(prev, dialog.categoryId, ids))
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
          onConfirm={() => {
            setBoard((prev) => deleteCategory(prev, deleting.id))
            show(t('fleet.toastCategoryDeleted', { name: labelOf(deleting) }))
            if (categoryFilter === deleting.id) setCategoryFilter('all')
            close()
          }}
          onCancel={close}
        />
      )}
      {detail && (
        <MachineDetailModal machine={detail} events={eventsForMachine(detail.id)} onClose={close} variant="fleet" />
      )}
    </div>
  )
}

export default FrotaPage

import React, { useState } from 'react'
import { Calendar, CircleCheck, CircleDot, CirclePlus, Search, Trash2, TriangleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { lastAccidentDate, matchesMachine, type FleetCategory } from '../../data/fleet'
import { DEFAULT_PERIOD, MACHINE_EVENTS, type Machine } from '../../data/machines'
import styles from './FleetRow.module.css'

interface FleetRowProps {
  category: FleetCategory
  label: string
  /** Máquinas da categoria já filtradas pela busca da página, na ordem do quadro. */
  machines: Machine[]
  /** Total de máquinas da categoria, sem filtro. */
  total: number
  renderCard: (machine: Machine) => React.ReactNode
  onDrop: (categoryId: string) => void
  onAdd: (categoryId: string) => void
  onDelete: (categoryId: string) => void
}

const ICONS: Partial<Record<FleetCategory['kind'], React.ReactNode>> = {
  acidentes: <TriangleAlert size={12} />,
  ativas: <CircleDot size={12} />,
}

const FleetRow: React.FC<FleetRowProps> = ({ category, label, machines, total, renderCard, onDrop, onAdd, onDelete }) => {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState(DEFAULT_PERIOD.from)
  const [to, setTo] = useState(DEFAULT_PERIOD.to)
  const isAccidents = category.kind === 'acidentes'

  const visible = machines.filter((machine) => {
    if (!matchesMachine(machine, query)) return false
    if (!isAccidents) return true
    const accident = lastAccidentDate(machine.id, MACHINE_EVENTS)
    return accident !== undefined && accident.data >= from && accident.data <= to
  })

  const addButton = (
    <button
      type="button"
      className={styles.addButton}
      aria-label={t('fleet.addMachines', { name: label })}
      onClick={() => onAdd(category.id)}
    >
      <CirclePlus size={18} />
    </button>
  )

  return (
    <section
      className={styles.row}
      aria-label={label}
      style={{ '--category-color': category.cor } as React.CSSProperties}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        onDrop(category.id)
      }}
    >
      <header className={styles.header}>
        <span className={styles.label}>
          <span className={styles.labelIcon}>{ICONS[category.kind] ?? <CircleCheck size={12} />}</span>
          <span className={styles.labelText}>{label}</span>
          <span className={styles.count} aria-label={t('fleet.machineCount', { count: total })}>
            {total}
          </span>
        </span>

        <div className={styles.tools}>
          <label className={styles.search}>
            <Search size={12} aria-hidden="true" />
            <input
              type="search"
              placeholder={t('fleet.rowSearchPlaceholder')}
              aria-label={`${t('fleet.rowSearchPlaceholder')} - ${label}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          {isAccidents && (
            <div className={styles.period}>
              <Calendar size={11} aria-hidden="true" />
              <strong>{t('fleet.periodLabel')}</strong>
              <input
                type="date"
                aria-label={t('machines.periodFrom')}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
              <span aria-hidden="true">-</span>
              <input
                type="date"
                aria-label={t('machines.periodTo')}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          )}
          {category.kind === 'custom' && (
            <button type="button" className={styles.deleteButton} onClick={() => onDelete(category.id)}>
              <Trash2 size={11} />
              {t('fleet.deleteCategory')}
            </button>
          )}
        </div>
      </header>

      {total === 0 ? (
        <div className={styles.empty}>{addButton}</div>
      ) : (
        <div className={styles.cards}>
          {visible.length === 0 ? <p className={styles.noResults}>{t('fleet.noResults')}</p> : visible.map(renderCard)}
          {addButton}
        </div>
      )}
    </section>
  )
}

export default FleetRow

import React from 'react'
import { Pencil, Trash2, Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Sector } from '../../data/team'
import styles from './SectorCard.module.css'

interface SectorCardProps {
  sector: Sector
  onOpen: (sector: Sector) => void
  onEdit: (sector: Sector) => void
  onDelete: (sector: Sector) => void
}

const SectorCard: React.FC<SectorCardProps> = ({ sector, onOpen, onEdit, onDelete }) => {
  const { t } = useTranslation()
  const name = sector.nome

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.openArea}
        aria-label={t('team.openDetails', { name })}
        onClick={() => onOpen(sector)}
      >
        <span className={styles.icon}>
          <Warehouse size={22} />
        </span>
        <span className={styles.name}>{name}</span>
      </button>
      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.delete}`}
          aria-label={t('team.remove', { name })}
          onClick={() => onDelete(sector)}
        >
          <Trash2 size={14} />
        </button>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.edit}`}
          aria-label={t('team.edit', { name })}
          onClick={() => onEdit(sector)}
        >
          <Pencil size={14} />
        </button>
      </div>
    </article>
  )
}

export default SectorCard

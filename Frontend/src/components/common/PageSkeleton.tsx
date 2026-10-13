import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './PageSkeleton.module.css'

interface PageSkeletonProps {
  variant: 'grid' | 'kanban' | 'team'
  count?: number
  /** Classe de grid da página, para o skeleton ocupar o mesmo layout do conteúdo. */
  gridClassName?: string
  /** Card da variante `grid`: um por tipo de card real. */
  card?: 'machine' | 'fleet'
  /** Placeholder da barra de filtros, montado pela página com as classes dela. */
  children?: React.ReactNode
}

export const SkeletonBlock: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className = '', ...rest }) => (
  <span className={`${styles.block} ${className}`} {...rest} />
)

const FleetCard: React.FC = () => (
  <div className={styles.fleet} data-skeleton-card>
    <SkeletonBlock className={styles.fleetStrip} data-skeleton-part="strip" />
    <div className={styles.fleetBody} data-skeleton-part="details">
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.fleetGroup}>
          <SkeletonBlock className={styles.fleetLabel} />
          <SkeletonBlock className={styles.fleetValue} />
        </div>
      ))}
    </div>
  </div>
)

const MachineCard: React.FC = () => (
  <div className={styles.machine} data-skeleton-card>
    <div className={styles.machineNames} data-skeleton-part="top">
      <SkeletonBlock className={styles.machineName} />
      <SkeletonBlock className={styles.machineId} />
    </div>
    <div className={styles.machineDetails} data-skeleton-part="details">
      <SkeletonBlock className={styles.machineLine} />
      <SkeletonBlock className={styles.machineLine} />
    </div>
    <div className={styles.machineFooter} data-skeleton-part="footer">
      <SkeletonBlock className={styles.machineBadge} />
      <SkeletonBlock className={styles.machineSession} />
    </div>
  </div>
)

const Card: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div className={`${styles.card} ${compact ? styles.compact : ''}`} data-skeleton-card>
    <div className={styles.head}>
      <span className={`${styles.block} ${styles.icon}`} />
      <div className={styles.lines}>
        <span className={`${styles.block} ${styles.line}`} />
        <span className={`${styles.block} ${styles.line} ${styles.short}`} />
      </div>
    </div>
    {!compact && (
      <>
        <span className={`${styles.block} ${styles.line}`} />
        <span className={`${styles.block} ${styles.line} ${styles.medium}`} />
        <span className={`${styles.block} ${styles.line} ${styles.short}`} />
      </>
    )}
  </div>
)

const cardsOf = (n: number, compact?: boolean) => Array.from({ length: n }, (_, i) => <Card key={i} compact={compact} />)

const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant, count = 8, gridClassName, card = 'machine', children }) => {
  const { t } = useTranslation()
  const grid = gridClassName ?? styles.grid
  const GridCard = card === 'fleet' ? FleetCard : MachineCard

  return (
    <div aria-busy="true" className={styles.wrapper}>
      <span role="status" className={styles.srOnly}>
        {t('common.loading')}
      </span>
      <div aria-hidden="true" className={styles.wrapper}>
        {children}

        {variant === 'grid' && (
          <div className={grid}>
            {Array.from({ length: count }, (_, i) => (
              <GridCard key={i} />
            ))}
          </div>
        )}

        {variant === 'kanban' &&
          [0, 1, 2, 3].map((row) => (
            <div key={row} className={styles.panel} data-skeleton-row>
              <div className={styles.panelHeader} data-skeleton-part="header">
                <SkeletonBlock className={styles.label} data-skeleton-part="label" />
                <div className={styles.panelTools} data-skeleton-part="tools">
                  <SkeletonBlock className={styles.panelSearch} />
                  {row === 0 && <SkeletonBlock className={styles.panelPeriod} data-skeleton-part="period" />}
                </div>
              </div>
              <div className={styles.kanbanCards}>
                {[0, 1, 2, 3].map((i) => (
                  <FleetCard key={i} />
                ))}
              </div>
            </div>
          ))}

        {variant === 'team' &&
          [8, 4].map((n, section) => (
            <div key={section} className={styles.panel} data-skeleton-row>
              <span className={`${styles.block} ${styles.label}`} />
              <div className={grid}>{cardsOf(n, section === 1)}</div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default PageSkeleton

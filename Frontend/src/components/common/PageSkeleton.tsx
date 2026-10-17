import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './PageSkeleton.module.css'

export type SkeletonCardKind = 'machine' | 'fleet' | 'employee' | 'sector'

interface PageSkeletonProps {
  /** Sem variante, a página monta o corpo com `children`, `SkeletonBlock` e `SkeletonCards`. */
  variant?: 'grid' | 'kanban'
  count?: number
  /** Classe de grid da página, para o skeleton ocupar o mesmo layout do conteúdo. */
  gridClassName?: string
  /** Card da variante `grid`: um por tipo de card real. */
  card?: SkeletonCardKind
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

const EmployeeCard: React.FC = () => (
  <div className={styles.employee} data-skeleton-card>
    <div className={styles.employeeInfo} data-skeleton-part="info">
      <SkeletonBlock className={styles.employeeName} />
      <SkeletonBlock className={styles.employeeLine} />
      <SkeletonBlock className={styles.employeeLine} />
    </div>
    <div className={styles.employeeActions}>
      <div className={styles.employeeIcons} data-skeleton-part="icons">
        <SkeletonBlock className={styles.employeeIcon} />
        <SkeletonBlock className={styles.employeeIcon} />
      </div>
      <SkeletonBlock className={styles.employeeSwitch} data-skeleton-part="switch" />
    </div>
  </div>
)

const SectorCard: React.FC = () => (
  <div className={styles.sector} data-skeleton-card>
    <SkeletonBlock className={styles.sectorName} data-skeleton-part="name" />
    <div className={styles.sectorButtons} data-skeleton-part="buttons">
      <SkeletonBlock className={styles.sectorButton} />
      <SkeletonBlock className={styles.sectorButton} />
    </div>
  </div>
)

const CARDS: Record<SkeletonCardKind, React.FC> = {
  machine: MachineCard,
  fleet: FleetCard,
  employee: EmployeeCard,
  sector: SectorCard,
}

/** Grade de cards do skeleton; `className` é a classe de grade da própria página. */
export const SkeletonCards: React.FC<{ card: SkeletonCardKind; count?: number; className?: string }> = ({
  card,
  count = 8,
  className,
}) => {
  const Card = CARDS[card]
  return (
    <div className={className ?? styles.grid}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} />
      ))}
    </div>
  )
}

const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant, count, gridClassName, card = 'machine', children }) => {
  const { t } = useTranslation()

  return (
    <div aria-busy="true" className={styles.wrapper}>
      <span role="status" className={styles.srOnly}>
        {t('common.loading')}
      </span>
      <div aria-hidden="true" className={styles.wrapper}>
        {children}

        {variant === 'grid' && <SkeletonCards card={card} count={count} className={gridClassName} />}

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
      </div>
    </div>
  )
}

export default PageSkeleton

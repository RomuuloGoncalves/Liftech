import React from 'react'
import { useTranslation } from 'react-i18next'
import styles from './PageSkeleton.module.css'

interface PageSkeletonProps {
  variant: 'grid' | 'kanban' | 'team'
  count?: number
  /** Classe de grid da página, para o skeleton ocupar o mesmo layout do conteúdo. */
  gridClassName?: string
}

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

const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant, count = 8, gridClassName }) => {
  const { t } = useTranslation()
  const grid = gridClassName ?? styles.grid

  return (
    <div aria-busy="true" className={styles.wrapper}>
      <span role="status" className={styles.srOnly}>
        {t('common.loading')}
      </span>
      <div aria-hidden="true" className={styles.wrapper}>
        {variant === 'grid' && <div className={grid}>{cardsOf(count)}</div>}

        {variant === 'kanban' &&
          [0, 1, 2].map((row) => (
            <div key={row} className={styles.panel} data-skeleton-row>
              <span className={`${styles.block} ${styles.label}`} />
              <div className={styles.kanbanCards}>{cardsOf(4)}</div>
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

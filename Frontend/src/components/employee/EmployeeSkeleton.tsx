import React from 'react'
import { useTranslation } from 'react-i18next'
import base from '../common/PageSkeleton.module.css'
import styles from './EmployeeSkeleton.module.css'

interface EmployeeSkeletonProps {
  variant: 'home' | 'list' | 'history' | 'session' | 'form' | 'title' | 'settings'
  /** Quantidade de cards da variante `list`. */
  count?: number
  /** Variante `form`: mostra os 2 botões; o sheet de ocorrência já tem os botões no rodapé. */
  buttons?: boolean
}

const Block: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className, ...rest }) => (
  <span className={`${base.block} ${className}`} {...rest} />
)

const Header: React.FC = () => (
  <div className={styles.header}>
    <Block className={styles.headerTitle} data-skeleton-part="title" />
    <div data-skeleton-part="subtitle">
      <Block className={styles.subtitleLine} />
      <Block className={`${styles.subtitleLine} ${styles.subtitleSecond}`} />
    </div>
  </div>
)

/** `extra`: card com data e hora (Empilhadeiras e Histórico), mais alto que o da Visão geral. */
const Cards: React.FC<{ count: number; extra?: boolean }> = ({ count, extra = false }) => (
  <div className={styles.list}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={`${styles.card} ${extra ? styles.cardExtra : ''}`} data-skeleton-card>
        <div className={styles.cardTop} data-skeleton-part="top">
          <div className={styles.cardNames}>
            <Block className={styles.cardName} />
            <Block className={styles.cardId} />
          </div>
          <Block className={styles.cardChip} />
        </div>
        <div className={styles.cardDivider} data-skeleton-part="divider" />
        <div className={styles.cardBottom} data-skeleton-part="bottom">
          <div className={styles.cardField} data-skeleton-part="field">
            <Block className={styles.cardLabel} />
            <Block className={styles.cardValue} data-skeleton-part="value" />
          </div>
          {extra && (
            <div className={styles.cardField} data-skeleton-part="field">
              <Block className={styles.cardLabel} />
              <Block className={styles.cardValue} data-skeleton-part="value" />
              <Block className={styles.cardValue} data-skeleton-part="value" />
            </div>
          )}
          <Block className={styles.cardAction} data-skeleton-part="action" />
        </div>
      </div>
    ))}
  </div>
)

const Visual: React.FC<EmployeeSkeletonProps> = ({ variant, count = 6, buttons = true }) => {
  switch (variant) {
    case 'home':
      return (
        <>
          <Header />
          <div className={styles.last}>
            <Block className={styles.banner} />
            <div className={styles.lastCard} data-skeleton-last>
              <div className={styles.lastCol}>
                <Block className={styles.lastName} />
                <Block className={styles.lastSub} />
              </div>
              <div className={styles.lastCol}>
                <Block className={styles.lastName} />
                <Block className={styles.lastSub} />
              </div>
            </div>
          </div>
          <div className={styles.stats}>
            <div className={styles.box} data-skeleton-box>
              <Block className={`${styles.line} ${styles.short}`} />
            </div>
            <div className={styles.box} data-skeleton-box>
              <Block className={`${styles.line} ${styles.short}`} />
            </div>
          </div>
          <div className={styles.available}>
            <div className={styles.sectionRow}>
              <Block className={styles.sectionLabel} />
              <Block className={styles.sectionLink} />
            </div>
            <Cards count={3} />
          </div>
        </>
      )
    case 'list':
      return (
        <>
          <Header />
          <Block className={styles.search} />
          <Cards count={count} extra />
        </>
      )
    case 'history':
      return (
        <>
          <Block className={styles.headerTitle} data-skeleton-part="title" />
          <div data-skeleton-part="subtitle">
            <Block className={styles.subtitleLine} />
            <Block className={`${styles.subtitleLine} ${styles.subtitleSecond}`} />
          </div>
          <Block className={styles.filtersTitle} data-skeleton-part="filters-title" />
          <div className={styles.filters} data-skeleton-filters>
            <Block className={styles.filterField} data-skeleton-field />
            <div className={styles.times}>
              <Block className={styles.filterField} data-skeleton-field />
              <Block className={styles.filterField} data-skeleton-field />
            </div>
            <Block className={styles.filterField} data-skeleton-field />
          </div>
          <Cards count={count} extra />
        </>
      )
    case 'session':
      return (
        <>
          <Block className={styles.illustration} />
          <Block className={styles.description} data-skeleton-part="description" />
          <Block className={styles.timer} />
          <div className={styles.actions}>
            <span className={`${base.block} ${styles.button}`} data-skeleton-button />
            <span className={`${base.block} ${styles.button}`} data-skeleton-button />
          </div>
        </>
      )
    case 'form':
      return (
        <>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`${styles.field} ${i === 3 ? styles.timeField : ''}`} data-skeleton-field>
              <Block className={styles.fieldLabel} />
              <Block className={styles.input} />
            </div>
          ))}
          {buttons && (
            <>
              <span className={`${base.block} ${styles.button}`} data-skeleton-button />
              <span className={`${base.block} ${styles.button}`} data-skeleton-button />
            </>
          )}
        </>
      )
    case 'title':
      return <Block className={styles.title} />
    case 'settings':
      return (
        <>
          <Block className={styles.title} />
          <Block className={styles.sectionLabel} />
          <div className={styles.card} data-skeleton-card>
            <Block className={`${styles.line} ${styles.medium}`} />
            {[0, 1, 2].map((i) => (
              <div key={i} className={styles.field} data-skeleton-field>
                <Block className={styles.fieldLabel} />
                <Block className={styles.input} />
              </div>
            ))}
            <span className={`${base.block} ${styles.notice}`} data-skeleton-notice />
          </div>
          <span className={`${base.block} ${styles.button}`} data-skeleton-button />
          <Block className={styles.sectionLabel} />
          <span className={`${base.block} ${styles.textarea}`} data-skeleton-textarea />
          <span className={`${base.block} ${styles.button}`} data-skeleton-button />
        </>
      )
  }
}

const EmployeeSkeleton: React.FC<EmployeeSkeletonProps> = (props) => {
  const { t } = useTranslation()
  const visual = `${styles.wrapper} ${props.variant === 'session' ? styles.session : ''} ${props.variant === 'history' ? styles.history : ''}`

  return (
    <div aria-busy="true" className={styles.wrapper}>
      <span role="status" className={base.srOnly}>
        {t('common.loading')}
      </span>
      <div aria-hidden="true" className={visual}>
        <Visual {...props} />
      </div>
    </div>
  )
}

export default EmployeeSkeleton

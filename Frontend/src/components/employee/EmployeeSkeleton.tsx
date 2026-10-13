import React from 'react'
import { useTranslation } from 'react-i18next'
import base from '../common/PageSkeleton.module.css'
import styles from './EmployeeSkeleton.module.css'

interface EmployeeSkeletonProps {
  variant: 'home' | 'list' | 'session' | 'form' | 'title' | 'settings'
  /** Quantidade de cards da variante `list`. */
  count?: number
  /** Variante `form`: mostra os 2 botões; o sheet de ocorrência já tem os botões no rodapé. */
  buttons?: boolean
}

const Block: React.FC<{ className: string }> = ({ className }) => (
  <span className={`${base.block} ${className}`} />
)

const Header: React.FC = () => (
  <div className={styles.wrapper}>
    <Block className={styles.title} />
    <Block className={styles.subtitle} />
  </div>
)

const Cards: React.FC<{ count: number }> = ({ count }) => (
  <div className={styles.list}>
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className={styles.card} data-skeleton-card>
        <Block className={`${styles.line} ${styles.medium}`} />
        <Block className={`${styles.line} ${styles.short}`} />
        <Block className={styles.line} />
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
          <Block className={styles.banner} />
          <div className={styles.stats}>
            <div className={`${styles.box} ${styles.card}`} data-skeleton-box>
              <Block className={`${styles.line} ${styles.short}`} />
            </div>
            <div className={`${styles.box} ${styles.card}`} data-skeleton-box>
              <Block className={`${styles.line} ${styles.short}`} />
            </div>
          </div>
          <div className={styles.sectionRow}>
            <Block className={styles.sectionLabel} />
            <Block className={styles.sectionLink} />
          </div>
          <Cards count={3} />
        </>
      )
    case 'list':
      return (
        <>
          <Header />
          <Block className={styles.search} />
          <Cards count={count} />
        </>
      )
    case 'session':
      return (
        <>
          <Block className={styles.illustration} />
          <Block className={`${styles.line} ${styles.medium}`} />
          <Block className={`${styles.line} ${styles.short}`} />
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
            <div key={i} className={styles.field} data-skeleton-field>
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
  const visual = `${styles.wrapper} ${props.variant === 'session' ? styles.session : ''}`

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

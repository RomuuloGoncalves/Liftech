import type { ReactNode } from 'react'
import styles from './InfoField.module.css'

type Props = {
  label: ReactNode
  children: ReactNode
  inline?: boolean
  highlight?: boolean
  title?: string
  className?: string
  valueClassName?: string
}

// Par rótulo/valor de card. Usar dentro de <dl>.
export function InfoField({
  label,
  children,
  inline,
  highlight,
  title,
  className,
  valueClassName,
}: Props) {
  const root = [
    styles.field,
    inline && styles.inline,
    highlight && styles.highlight,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={root}>
      <dt className={styles.label}>{label}</dt>
      <dd
        className={[styles.value, valueClassName].filter(Boolean).join(' ')}
        title={title}
      >
        {children}
      </dd>
    </div>
  )
}

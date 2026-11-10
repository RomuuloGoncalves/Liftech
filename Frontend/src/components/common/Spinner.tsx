import React from 'react'
import { Loader2 } from 'lucide-react'
import styles from './Spinner.module.css'

export interface SpinnerProps {
  size?: number
  className?: string
  ariaLabel?: string
  'data-testid'?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 16,
  className,
  ariaLabel,
  'data-testid': testId = 'spinner',
}) => {
  return (
    <Loader2
      size={size}
      className={`${styles.spinner} ${className ?? ''}`}
      aria-label={ariaLabel}
      aria-hidden={!ariaLabel}
      role={ariaLabel ? 'status' : undefined}
      data-testid={testId}
    />
  )
}

export interface SpinnerButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  busy?: boolean
  busyText?: React.ReactNode
  spinnerSize?: number
}

export const SpinnerButton = React.forwardRef<
  HTMLButtonElement,
  SpinnerButtonProps
>(function SpinnerButton(
  {
    busy = false,
    busyText,
    spinnerSize = 14,
    disabled,
    children,
    className,
    style,
    ...rest
  },
  ref
) {
  const isBusy = Boolean(busy)
  return (
    <button
      ref={ref}
      disabled={disabled || isBusy}
      aria-busy={isBusy ? 'true' : undefined}
      className={className}
      style={{
        ...(isBusy ? { cursor: 'not-allowed' } : {}),
        ...style,
      }}
      {...rest}
    >
      {isBusy ? (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Spinner size={spinnerSize} />
          <span>{busyText ?? children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
})

export default Spinner

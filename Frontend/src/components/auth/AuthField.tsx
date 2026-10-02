import React from 'react'
import formStyles from '../team/TeamForm.module.css'
import authStyles from './AuthForm.module.css'

export interface AuthFieldProps {
  id: string
  label: string
  type?: 'text' | 'email' | 'password'
  placeholder: string
  value: string
  error?: string
  onChange: (value: string) => void
  accentLabel?: boolean
}

const AuthField: React.FC<AuthFieldProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  error,
  onChange,
  accentLabel = false,
}) => (
  <div className={formStyles.field}>
    <label htmlFor={id} className={`${formStyles.label} ${accentLabel ? authStyles.labelAccent : ''}`}>
      {label}
    </label>
    <div className={formStyles.inputWrap}>
      <input
        id={id}
        type={type}
        className={[formStyles.input, authStyles.input, error ? formStyles.invalid : ''].join(' ')}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete="off"
      />
    </div>
    {error && (
      <span id={`${id}-error`} className={formStyles.error}>
        {error}
      </span>
    )}
  </div>
)

export default AuthField

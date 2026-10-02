import React, { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import AuthLayout from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'
import authStyles from '../components/auth/AuthForm.module.css'

interface FormValues {
  usuario: string
  senha: string
}

type Errors = Partial<Record<keyof FormValues, string>>

const LoginColaboradorPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const uid = useId()
  const [values, setValues] = useState<FormValues>({ usuario: '', senha: '' })
  const [errors, setErrors] = useState<Errors>({})

  const update = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    if (values.usuario.trim() === '') next.usuario = t('auth.required')
    if (values.senha.trim() === '') next.senha = t('auth.required')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    navigate('/')
  }

  return (
    <AuthLayout title={t('auth.loginAdminTitle')} subtitle={t('auth.loginCollabSubtitle')}>
      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        <AuthField
          id={`${uid}-usuario`}
          label={t('auth.usernameLabel')}
          type="text"
          placeholder={t('auth.usernamePlaceholder')}
          value={values.usuario}
          error={errors.usuario}
          onChange={update('usuario')}
          accentLabel
        />
        <AuthField
          id={`${uid}-senha`}
          label={t('auth.passwordLabel')}
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={values.senha}
          error={errors.senha}
          onChange={update('senha')}
          accentLabel
        />
        <button type="submit" className={`${authStyles.submitButton} ${authStyles.loginSubmit}`}>
          {t('auth.enterButton')}
        </button>
        <Link to="/login" className={authStyles.crossLink}>
          <Trans i18nKey="auth.administratorLink" components={{ b: <strong /> }} />
        </Link>
      </form>
    </AuthLayout>
  )
}

export default LoginColaboradorPage

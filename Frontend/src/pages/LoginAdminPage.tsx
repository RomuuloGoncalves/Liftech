import React, { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AuthLayout from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'
import formStyles from '../components/team/TeamForm.module.css'
import authStyles from '../components/auth/AuthForm.module.css'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormValues {
  email: string
  senha: string
}

type Errors = Partial<Record<keyof FormValues, string>>

const LoginAdminPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const uid = useId()
  const [values, setValues] = useState<FormValues>({ email: '', senha: '' })
  const [errors, setErrors] = useState<Errors>({})

  const update = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    if (values.email.trim() === '') {
      next.email = t('auth.required')
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = t('auth.invalidEmail')
    }
    if (values.senha.trim() === '') next.senha = t('auth.required')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    navigate('/')
  }

  return (
    <AuthLayout title={t('auth.loginAdminTitle')} subtitle={t('auth.loginAdminSubtitle')} titleAccent>
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        <AuthField
          id={`${uid}-email`}
          label={t('auth.emailLabel')}
          type="email"
          placeholder={t('auth.emailPlaceholder')}
          value={values.email}
          error={errors.email}
          onChange={update('email')}
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
        <button type="button" className={authStyles.forgotLink}>
          {t('auth.forgotPassword')}
        </button>
        <button type="submit" className={authStyles.submitButton}>
          {t('auth.enterButton')}
        </button>
        <Link to="/login/colaborador" className={authStyles.crossLink}>
          {t('auth.collaboratorLink')}
        </Link>
      </form>
    </AuthLayout>
  )
}

export default LoginAdminPage

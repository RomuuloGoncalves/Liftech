import React, { useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import AuthLayout from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'
import authStyles from '../components/auth/AuthForm.module.css'
import { authService } from '../services/authService'

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
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const update = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    setApiError(null)

    if (values.email.trim() === '') {
      next.email = t('auth.required')
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = t('auth.invalidEmail')
    }
    if (values.senha.trim() === '') next.senha = t('auth.required')
    
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const req = {
      email: values.email,
      senha: values.senha
    };

    console.log("Variável req que será enviada para a service:", req);

    try {
      setIsLoading(true)

      const response = await authService.loginAdmin(req)
      const data = response.data
      localStorage.setItem('token', data.token)

      navigate('/')

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao realizar login.'
      setApiError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title={t('auth.loginAdminTitle')} subtitle={t('auth.loginAdminSubtitle')}>
      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'left', marginBottom: '6px' }}>
            {apiError}
          </div>
        )}
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
          <Trans i18nKey="auth.forgotPassword" components={{ b: <strong /> }} />
        </button>
        <button type="submit" disabled={isLoading} className={`${authStyles.submitButton} ${authStyles.loginSubmit}`}>
          {t('auth.enterButton')}
        </button>
        
        <Link to="/login/colaborador" className={authStyles.crossLink}>
          <Trans i18nKey="auth.collaboratorLink" components={{ b: <strong /> }} />
        </Link>

      </form>
    </AuthLayout>
  )
}

export default LoginAdminPage
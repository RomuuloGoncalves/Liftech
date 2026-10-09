import React, { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import axios from 'axios'
import AuthLayout from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'
import authStyles from '../components/auth/AuthForm.module.css'
import formStyles from '../components/team/TeamForm.module.css'
import { authService, type RoleLogin } from '../services/authService'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface Errors {
  login?: string
  senha?: string
}

const LoginPage: React.FC<{ role: RoleLogin }> = ({ role }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const uid = useId()
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const isAdmin = role === 'admin'

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setApiError(null)
    const next: Errors = {}
    const value = login.trim()
    if (value === '') next.login = t('auth.required')
    else if (isAdmin && !EMAIL_PATTERN.test(value)) next.login = t('auth.invalidEmail')
    if (senha.trim() === '') next.senha = t('auth.required')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setIsLoading(true)
    try {
      await authService.login(role, value, senha)
      navigate('/')
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) setApiError(t('auth.invalidCredentials'))
      else if (axios.isAxiosError(e) && !e.response) setApiError(t('auth.networkError'))
      else setApiError(t('auth.loginError'))
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title={t('auth.loginAdminTitle')}
      subtitle={t(isAdmin ? 'auth.loginAdminSubtitle' : 'auth.loginCollabSubtitle')}
    >
      <form className={authStyles.form} onSubmit={handleSubmit} noValidate>
        {apiError && (
          <div role="alert" className={formStyles.error}>
            {apiError}
          </div>
        )}
        <AuthField
          id={`${uid}-login`}
          label={t(isAdmin ? 'auth.emailLabel' : 'auth.usernameLabel')}
          type={isAdmin ? 'email' : 'text'}
          placeholder={t(isAdmin ? 'auth.emailPlaceholder' : 'auth.usernamePlaceholder')}
          value={login}
          error={errors.login}
          onChange={setLogin}
          accentLabel
        />
        <AuthField
          id={`${uid}-senha`}
          label={t('auth.passwordLabel')}
          type="password"
          placeholder={t('auth.passwordPlaceholder')}
          value={senha}
          error={errors.senha}
          onChange={setSenha}
          accentLabel
        />
        <button type="button" className={authStyles.forgotLink}>
          <Trans i18nKey="auth.forgotPassword" components={{ b: <strong /> }} />
        </button>
        <button type="submit" disabled={isLoading} className={`${authStyles.submitButton} ${authStyles.loginSubmit}`}>
          {t('auth.enterButton')}
        </button>
      </form>
    </AuthLayout>
  )
}

export default LoginPage

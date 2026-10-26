import React, { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import AuthLayout from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'
import authStyles from '../components/auth/AuthForm.module.css'
import formStyles from '../components/team/TeamForm.module.css'
import { authService } from '../services/authService'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface FormValues {
  email: string
  nomeEmpresa: string
  nomeAdministrador: string
}

type Errors = Partial<Record<keyof FormValues, string>>

const SolicitarAcessoPage: React.FC = () => {
  const { t } = useTranslation()
  const uid = useId()
  const [values, setValues] = useState<FormValues>({ email: '', nomeEmpresa: '', nomeAdministrador: '' })
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const update = (field: keyof FormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: Errors = {}
    if (values.email.trim() === '') {
      next.email = t('auth.required')
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = t('auth.invalidEmail')
    }
    if (values.nomeEmpresa.trim() === '') next.nomeEmpresa = t('auth.required')
    if (values.nomeAdministrador.trim() === '') next.nomeAdministrador = t('auth.required')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setLoading(true)
    setSubmitError('')
    try {
      await authService.solicitarAcesso({
        email: values.email.trim(),
        nomeEmpresa: values.nomeEmpresa.trim(),
        nomeAdministrador: values.nomeAdministrador.trim(),
      })
      setSubmitted(true)
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) setSubmitError(t('auth.requestDuplicate'))
      else if (isAxiosError(error) && !error.response) setSubmitError(t('auth.networkError'))
      else setSubmitError(t('auth.requestError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title={t('auth.signupTitle')} subtitle={t('auth.signupSubtitle')}>
      {submitted ? (
        <div className={authStyles.successBox} role="status">
          <p className={authStyles.successTitle}>{t('auth.requestSuccessTitle')}</p>
          <p className={authStyles.successMessage}>{t('auth.requestSuccessMessage')}</p>
        </div>
      ) : (
        <form className={authStyles.form} onSubmit={handleSubmit} noValidate aria-label={t('auth.signupSectionTitle')}>
          <p className={authStyles.sectionTitle}>{t('auth.signupSectionTitle')}</p>
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
            id={`${uid}-empresa`}
            label={t('auth.companyNameLabel')}
            type="text"
            placeholder={t('auth.companyNamePlaceholder')}
            value={values.nomeEmpresa}
            error={errors.nomeEmpresa}
            onChange={update('nomeEmpresa')}
            accentLabel
          />
          <AuthField
            id={`${uid}-admin`}
            label={t('auth.adminNameLabel')}
            type="text"
            placeholder={t('auth.adminNamePlaceholder')}
            value={values.nomeAdministrador}
            error={errors.nomeAdministrador}
            onChange={update('nomeAdministrador')}
            accentLabel
          />
          {submitError && (
            <span role="alert" className={formStyles.error}>
              {submitError}
            </span>
          )}
          <button type="submit" className={authStyles.submitButton} disabled={loading}>
            {t('auth.requestAccessButton')}
          </button>
        </form>
      )}
    </AuthLayout>
  )
}

export default SolicitarAcessoPage

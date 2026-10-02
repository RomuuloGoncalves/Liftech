import React, { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Eye, Zap } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout'
import AuthField from '../components/auth/AuthField'
import formStyles from '../components/team/TeamForm.module.css'
import authStyles from '../components/auth/AuthForm.module.css'

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
    if (values.nomeEmpresa.trim() === '') next.nomeEmpresa = t('auth.required')
    if (values.nomeAdministrador.trim() === '') next.nomeAdministrador = t('auth.required')
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitted(true)
  }

  return (
    <AuthLayout
      title={t('auth.signupTitle')}
      subtitle={t('auth.signupSubtitle')}
      heroTitle={t('auth.heroSignupTitle')}
      heroSubtitle={t('auth.heroSignupSubtitle')}
      titleAccent
      layout="split"
      infoCards={[
        { icon: <ShieldCheck size={16} />, title: t('auth.infoSecurityTitle'), description: t('auth.infoSecurityDesc') },
        { icon: <Eye size={16} />, title: t('auth.infoControlTitle'), description: t('auth.infoControlDesc') },
        { icon: <Zap size={16} />, title: t('auth.infoEfficiencyTitle'), description: t('auth.infoEfficiencyDesc') },
      ]}
    >
      {submitted ? (
        <div className={authStyles.successBox} role="status">
          <p className={authStyles.successTitle}>{t('auth.requestSuccessTitle')}</p>
          <p className={authStyles.successMessage}>{t('auth.requestSuccessMessage')}</p>
        </div>
      ) : (
        <form className={formStyles.form} onSubmit={handleSubmit} noValidate aria-label={t('auth.signupSectionTitle')}>
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
          <button type="submit" className={authStyles.submitButton}>
            {t('auth.requestAccessButton')}
          </button>
          <Link to="/login/colaborador" className={authStyles.crossLink}>
            {t('auth.collaboratorLink')}
          </Link>
          <div className={authStyles.divider}>{t('auth.or')}</div>
          <div className={authStyles.secondaryRow}>
            <span className={authStyles.secondaryLabel}>{t('auth.alreadyRegistered')}</span>
            <Link to="/login" className={authStyles.secondaryButton}>
              {t('auth.enterNow')}
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  )
}

export default SolicitarAcessoPage

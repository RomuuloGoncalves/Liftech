import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Eye, Zap } from 'lucide-react'
import logo from '../../assets/logo.svg'
import logoName from '../../assets/logo-name.svg'
import styles from './AuthLayout.module.css'

export interface AuthLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

const Logo: React.FC<{ className: string }> = ({ className }) => (
  <div className={className}>
    <img src={logo} alt="" aria-hidden="true" />
    <img src={logoName} alt="Liftech" />
  </div>
)

const tabClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.tab} ${styles.tabActive}` : styles.tab

const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  const { t } = useTranslation()

  const infoCards = [
    { icon: <ShieldCheck size={12} fill="currentColor" stroke="#fff" />, title: t('auth.infoSecurityTitle'), description: t('auth.infoSecurityDesc') },
    { icon: <Eye size={12} />, title: t('auth.infoControlTitle'), description: t('auth.infoControlDesc') },
    { icon: <Zap size={12} fill="currentColor" />, title: t('auth.infoEfficiencyTitle'), description: t('auth.infoEfficiencyDesc') },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.formContent}>
        <header className={styles.header}>
          <Logo className={styles.logo} />
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
        </header>
        <nav className={styles.tabs} aria-label={t('auth.tabsLabel')}>
          <NavLink to="/solicitar-acesso" end className={tabClass}>{t('auth.tabRequest')}</NavLink>
          <NavLink to="/login" end className={tabClass}>{t('auth.tabAdmin')}</NavLink>
          <NavLink to="/login/colaborador" end className={tabClass}>{t('auth.tabCollaborator')}</NavLink>
        </nav>
        {children}
      </div>
      <div className={styles.hero}>
        <Logo className={styles.heroLogo} />
        <h2 className={styles.heroTitle}>{t('auth.heroSignupTitle')}</h2>
        <p className={styles.heroSubtitle}>{t('auth.heroSignupSubtitle')}</p>
        <ul className={styles.timeline}>
          {infoCards.map((card) => (
            <li key={card.title} className={styles.infoCard}>
              <p className={styles.infoCardTitle}>
                <span className={styles.infoIcon}>{card.icon}</span>
                {card.title}
              </p>
              <p className={styles.infoCardDesc}>{card.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default AuthLayout

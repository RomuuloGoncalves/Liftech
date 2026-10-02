import React from 'react'
import logo from '../../assets/logo.svg'
import logoName from '../../assets/logo-name.svg'
import styles from './AuthLayout.module.css'

export interface AuthInfoCard {
  icon: React.ReactNode
  title: string
  description: string
}

export interface AuthLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
  layout?: 'split' | 'single'
  heroTitle?: string
  heroSubtitle?: string
  infoCards?: AuthInfoCard[]
}

const Logo: React.FC<{ className: string }> = ({ className }) => (
  <div className={className}>
    <img src={logo} alt="" aria-hidden="true" />
    <img src={logoName} alt="Liftech" />
  </div>
)

const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  layout = 'single',
  heroTitle,
  heroSubtitle,
  infoCards = [],
}) => {
  const formBlock = (
    <div className={styles.formContent}>
      <header className={styles.header}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>
      {children}
    </div>
  )

  if (layout === 'single') {
    return <div className={styles.page}>{formBlock}</div>
  }

  return (
    <div className={`${styles.page} ${styles.split}`}>
      {formBlock}
      <div className={styles.hero}>
        <Logo className={styles.heroLogo} />
        <h2 className={styles.heroTitle}>{heroTitle}</h2>
        <p className={styles.heroSubtitle}>{heroSubtitle}</p>
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

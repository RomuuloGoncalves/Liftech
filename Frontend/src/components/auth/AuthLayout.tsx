import React from 'react'
import logo from '../../assets/logo.png'
import logoName from '../../assets/logo-name.png'
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
  titleAccent?: boolean
  layout?: 'split' | 'single'
  heroTitle?: string
  heroSubtitle?: string
  infoCards?: AuthInfoCard[]
}

const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  titleAccent = false,
  layout = 'single',
  heroTitle,
  heroSubtitle,
  infoCards = [],
}) => {
  const formBlock = (
    <div className={styles.formContent}>
      <div className={styles.logo}>
        <img src={logo} alt="" aria-hidden="true" width={24} height={24} />
        <img src={logoName} alt="Liftech" height={16} />
      </div>
      <div>
        <h1 className={`${styles.title} ${titleAccent ? styles.titleAccent : ''}`}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      {children}
    </div>
  )

  if (layout === 'single') {
    return (
      <div className={styles.singleWrapper}>
        <div className={styles.formSideSingle}>{formBlock}</div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.formSide}>{formBlock}</div>
      <div className={styles.heroSide}>
        <div className={`${styles.heroContent} ${styles.heroContentLeft}`}>
          <div className={styles.heroLogo}>
            <img src={logo} alt="" aria-hidden="true" width={24} height={24} />
            <img src={logoName} alt="Liftech" height={16} style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <h2 className={styles.heroTitle}>{heroTitle}</h2>
          <p className={styles.heroSubtitle}>{heroSubtitle}</p>
          <ul className={`${styles.infoList} ${styles.timeline}`} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {infoCards.map((card) => (
              <li key={card.title} className={styles.infoCard}>
                <span className={styles.timelineDot} aria-hidden="true" />
                <span className={styles.infoIcon}>{card.icon}</span>
                <div>
                  <p className={styles.infoCardTitle}>{card.title}</p>
                  <p className={styles.infoCardDesc}>{card.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

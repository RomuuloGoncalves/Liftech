import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Compass } from 'lucide-react'
import styles from './NotFoundPage.module.css'

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className={styles.page}>
      <Compass size={48} className={styles.icon} aria-hidden="true" />
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>{t('navigation.notFound')}</h2>
      <p className={styles.description}>{t('notFound.description')}</p>
      <Link to="/" className={styles.cta}>
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}

export default NotFoundPage

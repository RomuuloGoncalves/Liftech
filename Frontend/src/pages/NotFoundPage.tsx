import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import ForkliftLoop from '../components/common/ForkliftLoop'
import styles from './NotFoundPage.module.css'

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const home = pathname.startsWith('/funcionario/') ? '/funcionario' : '/'

  return (
    <div className={styles.page}>
      <ForkliftLoop className={styles.illustration} />
      <h1 className={styles.code}>404</h1>
      <h2 className={styles.title}>{t('notFound.title')}</h2>
      <p className={styles.description}>{t('notFound.description')}</p>
      <Link to={home} className={styles.cta}>
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}

export default NotFoundPage

import React from 'react'
import { useTranslation } from 'react-i18next'

const AlertasPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div style={{ padding: '2rem' }}>
      <h1>{t('navigation.alerts')}</h1>
      <p>Em construção.</p>
    </div>
  )
}

export default AlertasPage

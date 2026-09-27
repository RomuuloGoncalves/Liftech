import React from 'react'
import { useTranslation } from 'react-i18next'

const EquipePage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div style={{ padding: '2rem' }}>
      <h1>{t('navigation.team')}</h1>
      <p>Em construção.</p>
    </div>
  )
}

export default EquipePage

import React from 'react'
import { useTranslation } from 'react-i18next'

const EmployeeSettingsPage: React.FC = () => {
  const { t } = useTranslation()
  return <h1>{t('employee.settings.title')}</h1>
}

export default EmployeeSettingsPage

import React from 'react'
import { useTranslation } from 'react-i18next'

const EmployeeHistoryPage: React.FC = () => {
  const { t } = useTranslation()
  return <h1>{t('employee.history.title')}</h1>
}

export default EmployeeHistoryPage

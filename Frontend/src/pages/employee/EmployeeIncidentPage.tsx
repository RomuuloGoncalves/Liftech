import React from 'react'
import { useTranslation } from 'react-i18next'

const EmployeeIncidentPage: React.FC = () => {
  const { t } = useTranslation()
  return <h1>{t('employee.incident.title')}</h1>
}

export default EmployeeIncidentPage

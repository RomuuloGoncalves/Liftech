import React from 'react'
import { useTranslation } from 'react-i18next'

const EmployeeMachinesPage: React.FC = () => {
  const { t } = useTranslation()
  return <h1>{t('employee.machines.title')}</h1>
}

export default EmployeeMachinesPage

import React from 'react'
import { useTranslation } from 'react-i18next'

const EmployeeHomePage: React.FC = () => {
  const { t } = useTranslation()
  return <h1>{t('employee.home.title')}</h1>
}

export default EmployeeHomePage

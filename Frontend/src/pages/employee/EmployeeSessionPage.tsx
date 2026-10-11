import React from 'react'
import { useTranslation } from 'react-i18next'

const EmployeeSessionPage: React.FC = () => {
  const { t } = useTranslation()
  return <h1>{t('employee.session.end')}</h1>
}

export default EmployeeSessionPage

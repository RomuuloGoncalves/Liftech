import React from 'react'
import { useTranslation } from 'react-i18next'
import EmployeeSkeleton from '../../components/employee/EmployeeSkeleton'
import { useFirstVisitLoading } from '../../hooks/useFirstVisitLoading'

const EmployeeSettingsPage: React.FC = () => {
  const { t } = useTranslation()
  const loading = useFirstVisitLoading('employee-settings')
  if (loading) return <EmployeeSkeleton variant="title" />
  return <h1>{t('employee.settings.title')}</h1>
}

export default EmployeeSettingsPage

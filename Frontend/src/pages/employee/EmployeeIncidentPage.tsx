import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import IncidentSheet from '../../components/employee/IncidentSheet'

const EmployeeIncidentPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const goBack = () => (location.key === 'default' ? navigate('/funcionario') : navigate(-1))

  return <IncidentSheet open onClose={goBack} />
}

export default EmployeeIncidentPage

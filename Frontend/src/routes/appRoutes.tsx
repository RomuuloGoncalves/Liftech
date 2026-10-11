import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NotFoundPage from '../pages/NotFoundPage'
import VisaoGeralPage from '../pages/VisaoGeralPage'
import FrotaPage from '../pages/FrotaPage'
import EquipePage from '../pages/EquipePage'
import AlertasPage from '../pages/AlertasPage'
import LoginPage from '../pages/LoginPage'
import SolicitarAcessoPage from '../pages/SolicitarAcessoPage'
import EmployeeLayout from '../components/employee/EmployeeLayout'
import EmployeeHomePage from '../pages/employee/EmployeeHomePage'
import EmployeeMachinesPage from '../pages/employee/EmployeeMachinesPage'
import EmployeeSessionPage from '../pages/employee/EmployeeSessionPage'
import EmployeeHistoryPage from '../pages/employee/EmployeeHistoryPage'
import EmployeeIncidentPage from '../pages/employee/EmployeeIncidentPage'
import EmployeeSettingsPage from '../pages/employee/EmployeeSettingsPage'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VisaoGeralPage />} />
      <Route path="/frota" element={<FrotaPage />} />
      <Route path="/equipe" element={<EquipePage />} />
      <Route path="/alertas" element={<AlertasPage />} />
      <Route path="/login" element={<LoginPage key="admin" role="admin" />} />
      <Route path="/login/colaborador" element={<LoginPage key="colaborador" role="colaborador" />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />
      <Route path="/funcionario" element={<EmployeeLayout />}>
        <Route index element={<EmployeeHomePage />} />
        <Route path="maquinas" element={<EmployeeMachinesPage />} />
        <Route path="maquinas/:id" element={<EmployeeMachinesPage />} />
        <Route path="sessao" element={<EmployeeSessionPage />} />
        <Route path="historico" element={<EmployeeHistoryPage />} />
        <Route path="ocorrencia" element={<EmployeeIncidentPage />} />
        <Route path="configuracoes" element={<EmployeeSettingsPage />} />
      </Route>
      {/* Rota 404 - Fallback para rotas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes

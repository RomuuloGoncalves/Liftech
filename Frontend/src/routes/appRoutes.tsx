import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NotFoundPage from '../pages/NotFoundPage'
import VisaoGeralPage from '../pages/VisaoGeralPage'
import FrotaPage from '../pages/FrotaPage'
import EquipePage from '../pages/EquipePage'
import AlertasPage from '../pages/AlertasPage'
import LoginAdminPage from '../pages/LoginAdminPage'
import LoginColaboradorPage from '../pages/LoginColaboradorPage'
import SolicitarAcessoPage from '../pages/SolicitarAcessoPage'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VisaoGeralPage />} />
      <Route path="/frota" element={<FrotaPage />} />
      <Route path="/equipe" element={<EquipePage />} />
      <Route path="/alertas" element={<AlertasPage />} />
      <Route path="/login" element={<LoginAdminPage />} />
      <Route path="/login/colaborador" element={<LoginColaboradorPage />} />
      <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />
      {/* Rota 404 - Fallback para rotas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes

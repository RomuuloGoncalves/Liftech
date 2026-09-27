import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NotFoundPage from '../pages/NotFoundPage'
import VisaoGeralPage from '../pages/VisaoGeralPage'
import FrotaPage from '../pages/FrotaPage'
import EquipePage from '../pages/EquipePage'
import AlertasPage from '../pages/AlertasPage'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<VisaoGeralPage />} />
      <Route path="/frota" element={<FrotaPage />} />
      <Route path="/equipe" element={<EquipePage />} />
      <Route path="/alertas" element={<AlertasPage />} />
      {/* Rota 404 - Fallback para rotas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes

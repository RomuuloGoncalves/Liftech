import React from 'react'
import { Routes, Route } from 'react-router-dom'
import NotFoundPage from '../pages/NotFoundPage'

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Rota 404 - Fallback para rotas não encontradas */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default AppRoutes

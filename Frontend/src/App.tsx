import { useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import AppRoutes from './routes/appRoutes'
import './App.css'

const AUTH_ROUTES = ['/login', '/login/colaborador', '/solicitar-acesso']

function App() {
  const location = useLocation()
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname)

  if (isAuthRoute) {
    return <AppRoutes />
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Header />
        <main className="app-main">
          <AppRoutes />
        </main>
      </div>
    </div>
  )
}

export default App

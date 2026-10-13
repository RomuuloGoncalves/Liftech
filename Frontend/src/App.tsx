import { useLocation } from 'react-router-dom'
import { ActiveBranchProvider } from './context/ActiveBranchContext'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import AppRoutes from './routes/appRoutes'
import './App.css'

const AUTH_ROUTES = ['/login', '/login/colaborador', '/solicitar-acesso']

function AppShell() {
  const location = useLocation()
  const isStandaloneRoute =
    AUTH_ROUTES.includes(location.pathname) ||
    location.pathname === '/funcionario' ||
    location.pathname.startsWith('/funcionario/')

  if (isStandaloneRoute) {
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

const App = () => (
  <ActiveBranchProvider>
    <AppShell />
  </ActiveBranchProvider>
)

export default App

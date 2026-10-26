import { useLocation } from 'react-router-dom'
import { ActiveBranchProvider } from './context/ActiveBranchContext'
import SplashGate, { SPLASH_MS } from './components/common/SplashGate'
import { AlertsProvider } from './context/AlertsContext'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import AppRoutes from './routes/appRoutes'
import './App.css'

const AUTH_ROUTES = ['/login', '/login/colaborador', '/solicitar-acesso', '/solicitacoes']

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
    <AlertsProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="app-content">
          <Header />
          <main className="app-main">
            <AppRoutes />
          </main>
        </div>
      </div>
    </AlertsProvider>
  )
}

const App = () => (
  <ActiveBranchProvider>
    <SplashGate durationMs={SPLASH_MS}>
      <AppShell />
    </SplashGate>
  </ActiveBranchProvider>
)

export default App

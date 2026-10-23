import React, { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { Routes, Route } from 'react-router-dom'
import PageSkeleton from '../components/common/PageSkeleton'

// Carregamento lazy de páginas e layout para otimização de bundle
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))
const VisaoGeralPage = lazy(() => import('../pages/VisaoGeralPage'))
const DashboardPage = lazy(() => import('../pages/DashboardPage'))
const FrotaPage = lazy(() => import('../pages/FrotaPage'))
const EquipePage = lazy(() => import('../pages/EquipePage'))
const AlertasPage = lazy(() => import('../pages/AlertasPage'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const SolicitarAcessoPage = lazy(() => import('../pages/SolicitarAcessoPage'))
const SolicitacoesPage = lazy(() => import('../pages/SolicitacoesPage'))
const EmployeeLayout = lazy(() => import('../components/employee/EmployeeLayout'))
const EmployeeHomePage = lazy(() => import('../pages/employee/EmployeeHomePage'))
const EmployeeMachinesPage = lazy(() => import('../pages/employee/EmployeeMachinesPage'))
const EmployeeSessionPage = lazy(() => import('../pages/employee/EmployeeSessionPage'))
const EmployeeHistoryPage = lazy(() => import('../pages/employee/EmployeeHistoryPage'))
const EmployeeIncidentPage = lazy(() => import('../pages/employee/EmployeeIncidentPage'))
const EmployeeSettingsPage = lazy(() => import('../pages/employee/EmployeeSettingsPage'))

interface RouteErrorBoundaryProps {
  children: ReactNode
}

interface RouteErrorBoundaryState {
  hasError: boolean
}

export class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Falha ao carregar rota:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Ocorreu um erro ao carregar a página.</p>
          <button type="button" onClick={this.handleReload}>
            Recarregar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

const AppRoutes: React.FC = () => {
  return (
    <RouteErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<VisaoGeralPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/frota" element={<FrotaPage />} />
          <Route path="/equipe" element={<EquipePage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/login" element={<LoginPage key="admin" role="admin" />} />
          <Route path="/login/colaborador" element={<LoginPage key="colaborador" role="colaborador" />} />
          <Route path="/solicitar-acesso" element={<SolicitarAcessoPage />} />
          <Route path="/solicitacoes" element={<SolicitacoesPage />} />
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
      </Suspense>
    </RouteErrorBoundary>
  )
}

export default AppRoutes

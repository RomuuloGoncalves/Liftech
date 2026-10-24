import React, { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authService } from '../../services/authService'
import { routeSection } from '../../utils/routeSection'
import EmployeeHeader from './EmployeeHeader'
import EmployeeSkeleton from './EmployeeSkeleton'
import SessionBar from './SessionBar'
import TabBar from './TabBar'
import styles from './EmployeeLayout.module.css'

const EmployeeLayout: React.FC = () => {
  const { pathname } = useLocation()
  if (authService.getSession()?.role !== 'colaborador') return <Navigate to="/login/colaborador" replace />

  return (
    <div className={styles.layout}>
      <div className={styles.column}>
        <EmployeeHeader />
        <main className={styles.content}>
          <div key={routeSection(pathname)} className={styles.enter}>
            <Suspense fallback={<EmployeeSkeleton variant="home" />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      <SessionBar />
      <TabBar />
    </div>
  )
}

export default EmployeeLayout

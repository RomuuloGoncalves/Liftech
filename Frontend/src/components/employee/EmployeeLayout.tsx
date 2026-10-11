import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { routeSection } from '../../utils/routeSection'
import EmployeeHeader from './EmployeeHeader'
import SessionBar from './SessionBar'
import TabBar from './TabBar'
import styles from './EmployeeLayout.module.css'

const EmployeeLayout: React.FC = () => (
  <div className={styles.layout}>
    <div className={styles.column}>
      <EmployeeHeader />
      <main className={styles.content}>
        <div key={routeSection(useLocation().pathname)} className={styles.enter}>
          <Outlet />
        </div>
      </main>
    </div>
    <SessionBar />
    <TabBar />
  </div>
)

export default EmployeeLayout

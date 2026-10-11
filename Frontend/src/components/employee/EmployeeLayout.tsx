import React from 'react'
import { Outlet } from 'react-router-dom'
import EmployeeHeader from './EmployeeHeader'
import TabBar from './TabBar'
import styles from './EmployeeLayout.module.css'

const EmployeeLayout: React.FC = () => (
  <div className={styles.layout}>
    <div className={styles.column}>
      <EmployeeHeader />
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
    <TabBar />
  </div>
)

export default EmployeeLayout

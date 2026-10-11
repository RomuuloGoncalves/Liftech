import React from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CircleAlert, Copy, Forklift, History } from 'lucide-react'
import styles from './TabBar.module.css'

const TABS = [
  { to: '/funcionario', labelKey: 'employee.nav.overview', icon: Copy, end: true },
  { to: '/funcionario/maquinas', labelKey: 'employee.nav.machines', icon: Forklift, end: false },
  { to: '/funcionario/historico', labelKey: 'employee.nav.history', icon: History, end: false },
  { to: '/funcionario/ocorrencia', labelKey: 'employee.nav.incident', icon: CircleAlert, end: true },
]

const TabBar: React.FC = () => {
  const { t } = useTranslation()

  return (
    <nav className={styles.bar} aria-label={t('employee.common.navigationLabel')}>
      {TABS.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={t(labelKey)}
          className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}
        >
          <Icon size={22} aria-hidden="true" />
        </NavLink>
      ))}
    </nav>
  )
}

export default TabBar

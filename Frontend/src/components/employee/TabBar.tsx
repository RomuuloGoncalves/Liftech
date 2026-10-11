import React, { useState } from 'react'
import { NavLink, matchPath, useLocation } from 'react-router-dom'
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
  const { pathname } = useLocation()
  const activeIndex = TABS.findIndex(({ to, end }) => matchPath({ path: to, end }, pathname))
  const [shownIndex, setShownIndex] = useState(Math.max(activeIndex, 0))
  if (activeIndex >= 0 && activeIndex !== shownIndex) setShownIndex(activeIndex)

  return (
    <nav className={styles.bar} aria-label={t('employee.common.navigationLabel')}>
      <span
        data-testid="tab-indicator"
        aria-hidden="true"
        className={activeIndex >= 0 ? styles.indicator : `${styles.indicator} ${styles.hidden}`}
        style={{ '--tab-index': shownIndex } as React.CSSProperties}
      />
      {TABS.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          aria-label={t(labelKey)}
          className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}
        >
          <Icon size={22} aria-hidden="true" className={styles.icon} />
        </NavLink>
      ))}
    </nav>
  )
}

export default TabBar

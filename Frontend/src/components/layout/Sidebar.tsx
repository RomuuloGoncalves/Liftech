import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, ChevronRight, FileText, Menu, PanelLeft, Truck, Users, X } from 'lucide-react'
import logo from '../../assets/logo.png'
import styles from './Sidebar.module.css'

const COLLAPSED_STORAGE_KEY = 'liftech.sidebar.collapsed'
const MOBILE_BREAKPOINT = 768

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ size?: number }>
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Visão Geral', icon: FileText },
  { to: '/frota', label: 'Gerenciamento Frota', icon: Truck },
  { to: '/equipe', label: 'Gestão de Equipe', icon: Users },
  { to: '/alertas', label: 'Histórico de Alertas', icon: AlertCircle },
]

function readStoredCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function writeStoredCollapsed(value: boolean): void {
  try {
    window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(value))
  } catch {
    // localStorage unavailable (e.g. private browsing) - state stays in-memory only
  }
}

const Sidebar: React.FC = () => {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState<boolean>(readStoredCollapsed)
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < MOBILE_BREAKPOINT)
  const [mobileOpen, setMobileOpen] = useState<boolean>(false)

  useEffect(() => {
    const handleResize = () => {
      const nextIsMobile = window.innerWidth < MOBILE_BREAKPOINT
      setIsMobile(nextIsMobile)
      if (!nextIsMobile) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mobileOpen])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      writeStoredCollapsed(next)
      return next
    })
  }, [])

  const closeMobileDrawer = useCallback(() => setMobileOpen(false), [])

  const showCollapsedLayout = collapsed && !(isMobile && mobileOpen)

  return (
    <>
      {isMobile && !mobileOpen && (
        <button
          type="button"
          className={styles.hamburgerButton}
          aria-label="Abrir menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu size={20} />
        </button>
      )}

      {isMobile && mobileOpen && (
        <div className={styles.backdrop} onClick={closeMobileDrawer} aria-hidden="true" />
      )}

      <nav
        className={`${styles.sidebar} ${showCollapsedLayout ? styles.collapsed : ''} ${
          isMobile && mobileOpen ? styles.mobileOpen : ''
        }`}
        aria-label="Navegação principal"
      >
        <div className={styles.header}>
          <div className={styles.brand}>
            <img className={styles.brandMark} src={logo} alt="Liftech" width={24} height={24} />
            {!showCollapsedLayout && <span className={styles.brandName}>Liftech</span>}
          </div>

          {isMobile ? (
            mobileOpen && (
              <button
                type="button"
                className={styles.toggleButton}
                aria-label="Fechar menu"
                onClick={closeMobileDrawer}
              >
                <X size={16} />
              </button>
            )
          ) : (
            <button
              type="button"
              className={styles.toggleButton}
              aria-label={collapsed ? 'Expandir menu' : 'Colapsar menu'}
              aria-pressed={collapsed}
              onClick={toggleCollapsed}
            >
              <PanelLeft size={16} />
            </button>
          )}
        </div>

        {!showCollapsedLayout && <p className={styles.sectionLabel}>Páginas</p>}

        <ul className={styles.nav} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                  onClick={isMobile ? closeMobileDrawer : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.navIcon}>
                    <Icon size={18} />
                  </span>
                  {!showCollapsedLayout && <span className={styles.navLabel}>{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className={styles.spacer} />

        <div className={styles.footer}>
          <button type="button" className={styles.feedbackButton}>
            {!showCollapsedLayout && <span>Feedback &amp; Sugestões</span>}
            <ChevronRight size={16} />
          </button>
          {!showCollapsedLayout && (
            <a className={styles.privacyLink} href="/politicas-privacidade">
              Políticas &amp; Privacidades
            </a>
          )}
        </div>
      </nav>
    </>
  )
}

export default Sidebar

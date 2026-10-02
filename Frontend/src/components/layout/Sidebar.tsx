import React, { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ChevronRight,
  FileText,
  Forklift,
  LogIn,
  MessageCircle,
  Menu,
  PanelLeft,
  Users,
  X,
} from 'lucide-react'
import logo from '../../assets/logo.svg'
import logoName from '../../assets/logo-name.svg'
import styles from './Sidebar.module.css'

const COLLAPSED_STORAGE_KEY = 'liftech.sidebar.collapsed'
const MOBILE_BREAKPOINT = 768

interface NavItem {
  to: string
  labelKey: string
  icon: React.ComponentType<{ size?: number }>
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'navigation.overview', icon: FileText },
  { to: '/frota', labelKey: 'navigation.fleet', icon: Forklift },
  { to: '/equipe', labelKey: 'navigation.team', icon: Users },
  { to: '/alertas', labelKey: 'navigation.alerts', icon: AlertCircle },
]

const TEMP_AUTH_LINKS: { to: string; label: string }[] = [
  { to: '/login', label: 'Login Admin' },
  { to: '/login/colaborador', label: 'Login Colaborador' },
  { to: '/solicitar-acesso', label: 'Solicitar Acesso' },
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
    void 0
  }
}

const Sidebar: React.FC = () => {
  const location = useLocation()
  const { t } = useTranslation()
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
            <img className={styles.brandMark} src={logo} alt="" aria-hidden="true" width={24} height={24} />
            {!showCollapsedLayout && (
              <img className={styles.brandName} src={logoName} alt="Liftech" height={16} />
            )}
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

        {!showCollapsedLayout && <p className={styles.sectionLabel}>{t('navigation.pages')}</p>}

        <ul className={styles.nav} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => {
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
                  {!showCollapsedLayout && <span className={styles.navLabel}>{t(labelKey)}</span>}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className={styles.spacer} />

        {!showCollapsedLayout && (
          <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p className={styles.sectionLabel}>DEV: Telas de auth</p>
            {TEMP_AUTH_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={styles.navLink}
                onClick={isMobile ? closeMobileDrawer : undefined}
                style={{ fontSize: 12 }}
              >
                <span className={styles.navIcon}>
                  <LogIn size={16} />
                </span>
                <span className={styles.navLabel}>{label}</span>
              </Link>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.feedbackButton}
            aria-label={showCollapsedLayout ? t('navigation.feedback') : undefined}
            title={showCollapsedLayout ? t('navigation.feedback') : undefined}
          >
            <span className={styles.feedbackLabel}>
              <MessageCircle size={16} aria-hidden="true" />
              {!showCollapsedLayout && <span>{t('navigation.feedback')}</span>}
            </span>
            {!showCollapsedLayout && <ChevronRight size={16} aria-hidden="true" />}
          </button>
          {!showCollapsedLayout && (
            <a className={styles.privacyLink} href="/politicas-privacidade">
              {t('navigation.privacy')}
            </a>
          )}
        </div>
      </nav>
    </>
  )
}

export default Sidebar

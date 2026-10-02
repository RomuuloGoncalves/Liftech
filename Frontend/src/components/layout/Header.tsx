import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Globe, User, X } from 'lucide-react'
import styles from './Header.module.css'

import { useLanguage } from '../../hooks/useLanguage'
import { useTranslation } from 'react-i18next'

const ROUTE_KEYS: Record<string, string> = {
  '/': 'navigation.overview',
  '/frota': 'fleet.pageTitle',
  '/equipe': 'team.pageTitle',
  '/alertas': 'navigation.alerts',
}

const Header: React.FC = () => {
  const location = useLocation()
  const { language, changeLanguage, languages } = useLanguage()
  const { t } = useTranslation()
  const [languageOpen, setLanguageOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const titleKey = ROUTE_KEYS[location.pathname]
  const title = titleKey ? t(titleKey) : ''

  const closeLanguagePopover = useCallback(() => setLanguageOpen(false), [])

  useEffect(() => {
    if (!languageOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeLanguagePopover()
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        closeLanguagePopover()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [languageOpen, closeLanguagePopover])

  return (
    <header className={styles.header}>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.actions}>
        <div className={styles.popoverAnchor} ref={popoverRef}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Selecionar idioma"
            aria-expanded={languageOpen}
            onClick={() => setLanguageOpen((prev) => !prev)}
          >
            <Globe size={18} />
          </button>

          {languageOpen && (
            <div className={styles.popover} role="dialog" aria-label={t('languages.title')}>
              <div className={styles.popoverHeader}>
                <span className={styles.popoverTitle}>{t('languages.title')}</span>
                <button
                  type="button"
                  className={styles.popoverClose}
                  aria-label="Fechar seleção de idioma"
                  onClick={closeLanguagePopover}
                >
                  <X size={16} />
                </button>
              </div>

              <ul className={styles.languageList}>
                {languages.map(({ code, label, flag }) => (
                  <li key={code}>
                    <button
                      type="button"
                      className={styles.languageOption}
                      onClick={() => {
                        changeLanguage(code)
                        closeLanguagePopover()
                      }}
                    >
                      <span
                        className={`${styles.radio} ${language === code ? styles.radioChecked : ''}`}
                        role="radio"
                        aria-checked={language === code}
                        aria-label={t(label)}
                      />
                      <span className={styles.languageLabel}>{t(label)}</span>
                      <span aria-hidden="true">{flag}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="button" className={styles.iconButton} aria-label="Notificações">
          <Bell size={18} />
        </button>

        <button type="button" className={styles.avatarButton} aria-label="Perfil do usuário">
          <User size={18} />
        </button>
      </div>
    </header>
  )
}

export default Header

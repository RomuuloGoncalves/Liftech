import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bell, Globe, User, X } from 'lucide-react'
import styles from './Header.module.css'

interface LanguageOption {
  code: string
  label: string
  flag: string
}

const LANGUAGES: LanguageOption[] = [
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en-US', label: 'Inglês', flag: '🇺🇸' },
  { code: 'es', label: 'Espanhol', flag: '🇪🇸' },
  { code: 'fr', label: 'Francês', flag: '🇫🇷' },
  { code: 'ja', label: 'Japonês', flag: '🇯🇵' },
  { code: 'de', label: 'Alemão', flag: '🇩🇪' },
  { code: 'ru', label: 'Russo', flag: '🇷🇺' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'Visão Geral',
  '/frota': 'Gerenciamento Frota',
  '/equipe': 'Gestão de Equipe',
  '/alertas': 'Histórico de Alertas',
}

const Header: React.FC = () => {
  const location = useLocation()
  const [languageOpen, setLanguageOpen] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('pt-BR')
  const popoverRef = useRef<HTMLDivElement>(null)

  const title = PAGE_TITLES[location.pathname] ?? ''

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
            <div className={styles.popover} role="dialog" aria-label="Escolha um idioma">
              <div className={styles.popoverHeader}>
                <span className={styles.popoverTitle}>Escolha um idioma</span>
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
                {LANGUAGES.map(({ code, label, flag }) => (
                  <li key={code}>
                    <button
                      type="button"
                      className={styles.languageOption}
                      onClick={() => setSelectedLanguage(code)}
                    >
                      <span
                        className={`${styles.radio} ${selectedLanguage === code ? styles.radioChecked : ''}`}
                        role="radio"
                        aria-checked={selectedLanguage === code}
                        aria-label={label}
                      />
                      <span className={styles.languageLabel}>{label}</span>
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

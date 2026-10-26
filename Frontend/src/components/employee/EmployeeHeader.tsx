import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, TriangleAlert, X } from 'lucide-react'
import logo from '../../assets/logo.svg'
import logoName from '../../assets/logo-name.svg'
import styles from './EmployeeHeader.module.css'

const HOME = '/funcionario'
const SETTINGS = '/funcionario/configuracoes'
const INCIDENT = '/funcionario/ocorrencia'

const EmployeeHeader: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const inSettings = location.pathname === SETTINGS

  const handleMenu = () => {
    if (!inSettings) return navigate(SETTINGS)
    if (location.key === 'default') return navigate(HOME)
    navigate(-1)
  }

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <img src={logo} alt="" aria-hidden="true" width={24} height={24} />
        <img src={logoName} alt="Liftech" height={16} />
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.alertButton}
          aria-label={t('employee.common.alertButton')}
          onClick={() => navigate(INCIDENT)}
        >
          <TriangleAlert size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={inSettings ? t('employee.settings.close') : t('employee.common.menuButton')}
          onClick={handleMenu}
        >
          {inSettings ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}

export default EmployeeHeader

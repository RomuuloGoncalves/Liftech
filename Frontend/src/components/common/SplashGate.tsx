import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import logo from '../../assets/logo.svg'
import logoName from '../../assets/logo-name.svg'
import styles from './SplashGate.module.css'

// eslint-disable-next-line react-refresh/only-export-components
export const SPLASH_MS = import.meta.env.MODE === 'test' ? 0 : 1500
export const SEEN_KEY = 'liftech.splashSeen'

// eslint-disable-next-line react-refresh/only-export-components
export function shouldShowSplash(pathname: string, durationMs: number): boolean {
  if (durationMs <= 0) return false
  if (pathname === '/funcionario' || pathname.startsWith('/funcionario/')) return false

  try {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) {
      return false
    }
  } catch {
    // Tratado como sem preferência de movimento reduzido
  }

  try {
    if (typeof window !== 'undefined' && window.sessionStorage?.getItem(SEEN_KEY) === '1') {
      return false
    }
  } catch {
    // Erro ao ler sessionStorage => trata como "não vista"
  }

  return true
}

const Splash: React.FC = () => (
  <div className={styles.splash} role="img" aria-label="Liftech">
    <img src={logo} alt="" className={styles.mark} />
    <img src={logoName} alt="" className={styles.name} />
  </div>
)

export interface SplashGateProps {
  durationMs?: number
  children: React.ReactNode
}

export const SplashGate: React.FC<SplashGateProps> = ({
  durationMs = SPLASH_MS,
  children,
}) => {
  const { pathname } = useLocation()
  const [show, setShow] = useState(() => shouldShowSplash(pathname, durationMs))

  useEffect(() => {
    if (!show) return

    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Erro ao gravar sessionStorage ignorado
    }

    const timer = setTimeout(() => {
      setShow(false)
    }, durationMs)

    return () => {
      clearTimeout(timer)
    }
  }, [show, durationMs])

  if (show) {
    return <Splash />
  }

  return <>{children}</>
}

export default SplashGate

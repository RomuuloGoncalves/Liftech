import { useEffect, useState } from 'react'

/** Latência simulada dos dados mock; zero nos testes para o conteúdo aparecer na hora. */
export const MOCK_LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 600

// ponytail: estado de módulo, dura até recarregar a página; quando houver API, `loading` vem da requisição.
const visited = new Set<string>()

export function resetVisitedPages(): void {
  visited.clear()
}

/** `true` na primeira visita da página na sessão, até o atraso simulado terminar. */
export function useFirstVisitLoading(key: string, delayMs = MOCK_LATENCY_MS): boolean {
  const [loading, setLoading] = useState(() => delayMs > 0 && !visited.has(key))

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => {
      visited.add(key)
      setLoading(false)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [key, delayMs, loading])

  return loading
}

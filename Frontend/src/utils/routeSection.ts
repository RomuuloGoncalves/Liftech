const SECTIONS = ['maquinas', 'historico', 'sessao', 'ocorrencia', 'configuracoes']

export const routeSection = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'funcionario') return pathname
  if (segments.length === 1) return 'overview'
  return SECTIONS.includes(segments[1]) ? segments[1] : pathname
}

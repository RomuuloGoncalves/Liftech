import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import NotFoundPage from '../../pages/NotFoundPage'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <NotFoundPage />
    </MemoryRouter>
  )

describe('NotFoundPage (pagina-404-tematica)', () => {
  it('shows the forklift video, 404 and the warehouse copy in pt-BR (NF2-01, NF2-02)', () => {
    const { container } = renderAt('/xyz')
    const video = container.querySelector('video')
    expect(video).toHaveAttribute('aria-hidden', 'true')
    expect(video?.loop).toBe(true)
    expect(video?.muted).toBe(true)
    expect([...container.querySelectorAll('video source')].map((s) => s.getAttribute('type'))).toEqual([
      'video/webm',
      'video/mp4',
    ])
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Esta rota saiu do mapa do galpão')
    expect(screen.getByText(/siga por outro corredor/i)).toBeInTheDocument()
  })

  it.each([
    ['/xyz', '/'],
    ['/frota/nada', '/'],
    ['/funcionarios', '/'],
    ['/funcionario/xyz', '/funcionario'],
    ['/funcionario/maquinas/a/b', '/funcionario'],
  ])('at %s the back link goes to %s (NF2-06, NF2-07, NF2-08)', (path, home) => {
    renderAt(path)
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', home)
  })
})

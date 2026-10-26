import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import StatusBadge, { STATUS_TONE } from '../../../components/machines/StatusBadge'
import i18n from '../../../config/i18n'
import { MACHINE_STATUSES } from '../../../data/machines'

afterEach(() => i18n.changeLanguage('pt-BR'))

describe('StatusBadge', () => {
  it.each([
    ['disponivel', 'Disponível'],
    ['em_uso', 'Em uso'],
    ['manutencao', 'Em manutenção'],
    ['alerta', 'Alerta'],
    ['offline', 'Offline'],
  ] as const)('shows %s as %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('gives each of the 5 codes a distinct class', () => {
    const classes = MACHINE_STATUSES.map((status) => {
      const { container, unmount } = render(<StatusBadge status={status} />)
      const className = (container.firstChild as HTMLElement).className
      unmount()
      return className
    })
    expect(new Set(classes).size).toBe(5)
  })

  it('renders the label in en-US', async () => {
    await i18n.changeLanguage('en-US')
    render(<StatusBadge status="alerta" />)
    expect(screen.getByText('Alert')).toBeInTheDocument()
  })
})

describe('STATUS_TONE', () => {
  it('has a distinct header tone for each of the 5 codes', () => {
    const tones = MACHINE_STATUSES.map((status) => STATUS_TONE[status])
    tones.forEach((tone) => expect(tone).toBeTruthy())
    expect(new Set(tones).size).toBe(5)
  })
})

import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AlertasPage from '../../pages/AlertasPage'
import { DEFAULT_PERIOD, MACHINES, MACHINE_EVENTS } from '../../data/machines'
import { formatAlertDate } from '../../utils/format'

const URGENCY_LABEL = { frenagem: 'Média', colisao: 'Alta', tombamento: 'Crítica' } as const

const accidentsIn = (from: string, to: string) =>
  MACHINE_EVENTS.filter((e) => e.tipo === 'acidente' && (!from || e.data >= from) && (!to || e.data <= to)).sort(
    (a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio)
  )

const cards = () => screen.queryAllByRole('article')
const field = (card: HTMLElement, label: string) => within(card).getByText(label).nextElementSibling?.textContent
const counter = () => within(screen.getByRole('heading', { name: /Acidentes/ })).getByTestId('alerts-count').textContent
const search = (value: string) => fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value } })
const setDate = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('AlertasPage', () => {
  it('renders one card per accident of the default period, and no maintenance event', () => {
    render(<AlertasPage />)
    const expected = accidentsIn(DEFAULT_PERIOD.from, DEFAULT_PERIOD.to)
    expect(expected.length).toBeGreaterThan(0)
    expect(cards()).toHaveLength(expected.length)
  })

  it('orders the cards from the most recent accident to the oldest', () => {
    render(<AlertasPage />)
    const expected = accidentsIn(DEFAULT_PERIOD.from, DEFAULT_PERIOD.to).map(
      (e) => `${formatAlertDate(e.data, 'pt-BR')}, ${e.inicio}`
    )
    expect(cards().map((card) => field(card, 'Data e Hora'))).toEqual(expected)
  })

  it('shows machine name, code, sector, event operator, date and time and urgency on each card', () => {
    const event = accidentsIn('', '').find((e) => e.machineId === '4')!
    const machine = MACHINES.find((m) => m.id === '4')!
    render(<AlertasPage />)
    search('EMP-084')
    setDate('Data inicial', event.data)
    setDate('Data final', event.data)

    const [card] = cards()
    expect(cards()).toHaveLength(1)
    expect(within(card).getByText(machine.nome)).toBeInTheDocument()
    expect(within(card).getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(field(card, 'Setor:')).toBe(machine.setor)
    expect(field(card, 'Funcionário:')).toBe(event.operador)
    expect(field(card, 'Data e Hora')).toBe(`${formatAlertDate(event.data, 'pt-BR')}, ${event.inicio}`)
    expect(field(card, 'Nível de urgência')).toBe(URGENCY_LABEL[event.causa!])
  })

  it('maps each accident cause to its urgency level', () => {
    render(<AlertasPage />)
    const expected = accidentsIn(DEFAULT_PERIOD.from, DEFAULT_PERIOD.to).map((e) => URGENCY_LABEL[e.causa!])
    expect(cards().map((card) => field(card, 'Nível de urgência'))).toEqual(expected)
    expect(new Set(expected)).toEqual(new Set(['Média', 'Alta', 'Crítica']))
  })

  it('shows the Acidentes label with the count of visible cards', () => {
    render(<AlertasPage />)
    expect(counter()).toBe(String(cards().length))
    search('EMP-084')
    expect(counter()).toBe(String(cards().length))
    expect(cards().length).toBe(accidentsIn(DEFAULT_PERIOD.from, DEFAULT_PERIOD.to).filter((e) => e.machineId === '4').length)
  })

  it('filters by machine code ignoring case and surrounding spaces', () => {
    render(<AlertasPage />)
    search('  emp-084 ')
    expect(cards().length).toBeGreaterThan(0)
    cards().forEach((card) => expect(within(card).getByText('EMP-084(ID)')).toBeInTheDocument())
  })

  it('filters by machine name', () => {
    render(<AlertasPage />)
    search('atlas')
    const atlasIds = new Set(MACHINES.filter((m) => m.nome.includes('Atlas')).map((m) => m.id))
    const expected = accidentsIn(DEFAULT_PERIOD.from, DEFAULT_PERIOD.to).filter((e) => atlasIds.has(e.machineId))
    expect(cards()).toHaveLength(expected.length)
    cards().forEach((card) => expect(within(card).getByText('Empilhadeira a Combustão Atlas-S')).toBeInTheDocument())
  })

  it('shows every card of the period when the search has only spaces', () => {
    render(<AlertasPage />)
    search('   ')
    expect(cards()).toHaveLength(accidentsIn(DEFAULT_PERIOD.from, DEFAULT_PERIOD.to).length)
  })

  it('keeps only accidents between the start and end dates, inclusive', () => {
    const all = accidentsIn('', '')
    const from = all[all.length - 1].data
    const to = all[Math.floor(all.length / 2)].data
    render(<AlertasPage />)
    setDate('Data inicial', from)
    setDate('Data final', to)
    expect(cards()).toHaveLength(accidentsIn(from, to).length)
    expect(cards().length).toBeLessThan(all.length)
  })

  it('treats a cleared date as an open side of the period', () => {
    render(<AlertasPage />)
    const to = accidentsIn('', '')[5].data
    setDate('Data final', to)
    setDate('Data inicial', '')
    expect(cards()).toHaveLength(accidentsIn('', to).length)
  })

  it('shows the empty state and counter 0 when the start date is after the end date', () => {
    render(<AlertasPage />)
    setDate('Data inicial', '2026-01-01')
    setDate('Data final', '2025-01-01')
    expect(cards()).toHaveLength(0)
    expect(screen.getByText('Nenhum alerta encontrado')).toBeInTheDocument()
    expect(counter()).toBe('0')
  })

  it('shows the empty state when no machine matches the search', () => {
    render(<AlertasPage />)
    search('XYZ-999')
    expect(screen.getByText('Nenhum alerta encontrado')).toBeInTheDocument()
    expect(counter()).toBe('0')
  })

  it('opens the machine detail on the alerts tab, without badge or edit/delete, and closes keeping filters', () => {
    render(<AlertasPage />)
    search('EMP-084')
    const visible = cards().length
    fireEvent.click(within(cards()[0]).getByRole('button', { name: /Ver detalhes de/ }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('EMP-084(ID)')).toBeInTheDocument()
    const tabs = within(dialog).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Histórico de alertas', 'Histórico de reparos'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(within(dialog).queryByText('Em manutenção')).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Editar|Excluir/ })).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: /fechar/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Procurar Máquina')).toHaveValue('EMP-084')
    expect(cards()).toHaveLength(visible)
  })
})

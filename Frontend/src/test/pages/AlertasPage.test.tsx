import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AlertasPage from '../../pages/AlertasPage'
import styles from '../../pages/AlertasPage.module.css'

const loading = vi.hoisted(() => ({ value: false }))
vi.mock('../../hooks/useFirstVisitLoading', () => ({ useFirstVisitLoading: () => loading.value }))
import { DEFAULT_PERIOD, MACHINES, MACHINE_EVENTS, defaultPeriodTo } from '../../data/machines'
import { incidentService, type FiltroIncidentes, type Incidente } from '../../services/incidentService'
import { machineService } from '../../services/machineService'
import { formatAlertDate } from '../../utils/format'

vi.mock('../../services/incidentService', () => ({ incidentService: { listar: vi.fn(), reportar: vi.fn() } }))
vi.mock('../../services/machineService', () => ({ machineService: { listar: vi.fn() } }))

const listarIncidentes = vi.mocked(incidentService.listar)

// The mock accidents as the API would send them: odd ones reported by the collaborator.
const ACCIDENTS = MACHINE_EVENTS.filter((e) => e.tipo === 'acidente').map((e, index) => ({
  event: e,
  incident: {
    _id: e.id,
    machineId: e.machineId,
    maquina: { nome: 'x', identificacao: 'x', setor: 'x' },
    operador: { nome: e.operador },
    dataIncidente: new Date(`${e.data}T${e.inicio}`).toISOString(),
    forcaImpacto: null,
    status: 'pendente',
    origem: index % 2 ? 'funcionario' : 'sensor',
    descricao: null,
  } satisfies Incidente,
}))

const accidentsIn = (from: string, to: string) =>
  ACCIDENTS.filter(({ event: e }) => (!from || e.data >= from) && (!to || e.data <= to)).sort((a, b) =>
    (b.event.data + b.event.inicio).localeCompare(a.event.data + a.event.inicio)
  )

// Stand-in for GET /incidents: by machine and local day, inclusive, most recent first.
const listIncidents = async ({ machineId, from, to }: FiltroIncidentes = {}) =>
  accidentsIn(from ?? '', to ?? '')
    .filter(({ event }) => !machineId || event.machineId === machineId)
    .map(({ incident }) => incident)

const DEFAULT = () => accidentsIn(DEFAULT_PERIOD.from, defaultPeriodTo()).map(({ event }) => event)

const cards = () => screen.queryAllByRole('article')
const field = (card: HTMLElement, label: string) => within(card).getByText(label).nextElementSibling?.textContent
const counter = () => within(screen.getByRole('heading', { name: /Acidentes/ })).getByTestId('alerts-count').textContent
const search = (value: string) => fireEvent.change(screen.getByPlaceholderText('Procurar Máquina'), { target: { value } })
const loaded = () => act(async () => {})
const setDate = async (label: string, value: string) => {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
  await loaded()
}
const renderPage = async () => {
  render(<AlertasPage />)
  await loaded()
}

beforeEach(() => {
  listarIncidentes.mockReset().mockImplementation(listIncidents)
  vi.mocked(machineService.listar).mockReset().mockResolvedValue(MACHINES)
})

describe('AlertasPage', () => {
  it('renders one card per API incident of the default period, which ends today', async () => {
    await renderPage()
    expect(listarIncidentes).toHaveBeenCalledWith({ from: DEFAULT_PERIOD.from, to: defaultPeriodTo() })
    expect(defaultPeriodTo()).toBe([DEFAULT_PERIOD.to, new Date().toLocaleDateString('sv')].sort()[1])
    expect(DEFAULT().length).toBeGreaterThan(0)
    expect(cards()).toHaveLength(DEFAULT().length)
  })

  it('keeps the API order, from the most recent incident to the oldest', async () => {
    await renderPage()
    const expected = DEFAULT().map((e) => `${formatAlertDate(e.data, 'pt-BR')}, ${e.inicio}`)
    expect(cards().map((card) => field(card, 'Data e Hora'))).toEqual(expected)
  })

  it('shows machine name, code, sector, incident operator, date and time and urgency on each card', async () => {
    const event = accidentsIn('', '').find(({ event: e }) => e.machineId === '4')!.event
    const machine = MACHINES.find((m) => m.id === '4')!
    await renderPage()
    search('EMP-084')
    await setDate('Data inicial', event.data)
    await setDate('Data final', event.data)

    const [card] = cards()
    expect(cards()).toHaveLength(1)
    expect(within(card).getByText(machine.nome)).toBeInTheDocument()
    expect(within(card).getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(field(card, 'Setor:')).toBe(machine.setor)
    expect(field(card, 'Funcionário:')).toBe(event.operador)
    expect(field(card, 'Data e Hora')).toBe(`${formatAlertDate(event.data, 'pt-BR')}, ${event.inicio}`)
    expect(field(card, 'Nível de urgência')).toBe('Alta')
  })

  it('shows urgency Alta for sensor collisions and for collaborator reports', async () => {
    await renderPage()
    const origins = new Set(accidentsIn(DEFAULT_PERIOD.from, defaultPeriodTo()).map(({ incident }) => incident.origem))
    expect(origins).toEqual(new Set(['sensor', 'funcionario']))
    expect(new Set(cards().map((card) => field(card, 'Nível de urgência')))).toEqual(new Set(['Alta']))
  })

  it('skips an incident whose machine is not in the API list', async () => {
    vi.mocked(machineService.listar).mockResolvedValue(MACHINES.filter((m) => m.id !== '4'))
    await renderPage()
    expect(cards()).toHaveLength(DEFAULT().filter((e) => e.machineId !== '4').length)
  })

  it('shows the Acidentes label with the count of visible cards', async () => {
    await renderPage()
    expect(counter()).toBe(String(cards().length))
    search('EMP-084')
    expect(counter()).toBe(String(cards().length))
    expect(cards().length).toBe(DEFAULT().filter((e) => e.machineId === '4').length)
  })

  it('filters by machine code ignoring case and surrounding spaces', async () => {
    await renderPage()
    search('  emp-084 ')
    expect(cards().length).toBeGreaterThan(0)
    cards().forEach((card) => expect(within(card).getByText('EMP-084(ID)')).toBeInTheDocument())
  })

  it('filters by machine name', async () => {
    await renderPage()
    search('atlas')
    const atlasIds = new Set(MACHINES.filter((m) => m.nome.includes('Atlas')).map((m) => m.id))
    expect(cards()).toHaveLength(DEFAULT().filter((e) => atlasIds.has(e.machineId)).length)
    cards().forEach((card) => expect(within(card).getByText('Empilhadeira a Combustão Atlas-S')).toBeInTheDocument())
  })

  it('shows every card of the period when the search has only spaces', async () => {
    await renderPage()
    search('   ')
    expect(cards()).toHaveLength(DEFAULT().length)
  })

  it('asks the API for the chosen period and lists what it returns', async () => {
    const all = accidentsIn('', '')
    const from = all[all.length - 1].event.data
    const to = all[Math.floor(all.length / 2)].event.data
    await renderPage()
    await setDate('Data inicial', from)
    await setDate('Data final', to)
    expect(listarIncidentes).toHaveBeenLastCalledWith({ from, to })
    expect(cards()).toHaveLength(accidentsIn(from, to).length)
    expect(cards().length).toBeLessThan(all.length)
  })

  it('treats a cleared date as an open side of the period', async () => {
    await renderPage()
    const to = accidentsIn('', '')[5].event.data
    await setDate('Data final', to)
    await setDate('Data inicial', '')
    expect(listarIncidentes).toHaveBeenLastCalledWith({ from: undefined, to })
    expect(cards()).toHaveLength(accidentsIn('', to).length)
  })

  it('shows the empty state and counter 0 when the start date is after the end date', async () => {
    await renderPage()
    await setDate('Data inicial', '2026-01-01')
    await setDate('Data final', '2025-01-01')
    expect(cards()).toHaveLength(0)
    expect(screen.getByText('Nenhum alerta encontrado')).toBeInTheDocument()
    expect(counter()).toBe('0')
  })

  it('shows the empty state when the API fails', async () => {
    listarIncidentes.mockRejectedValue(new Error('500'))
    await renderPage()
    expect(screen.getByText('Nenhum alerta encontrado')).toBeInTheDocument()
  })

  it('shows the empty state when no machine matches the search', async () => {
    await renderPage()
    search('XYZ-999')
    expect(screen.getByText('Nenhum alerta encontrado')).toBeInTheDocument()
    expect(counter()).toBe('0')
  })

  it('opens the machine detail on the alerts tab with the API incidents, repairs from the mock, and closes keeping filters', async () => {
    await renderPage()
    search('EMP-084')
    const visible = cards().length
    fireEvent.click(within(cards()[0]).getByRole('button', { name: /Ver detalhes de/ }))
    await loaded()

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByText('EMP-084(ID)')).toBeInTheDocument()
    const tabs = within(dialog).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Histórico de alertas', 'Histórico de reparos'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(listarIncidentes).toHaveBeenLastCalledWith({ machineId: '4', from: DEFAULT_PERIOD.from, to: defaultPeriodTo() })
    expect(within(within(dialog).getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(visible)
    expect(within(dialog).queryByText('Em manutenção')).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('button', { name: /Editar|Excluir/ })).not.toBeInTheDocument()

    fireEvent.click(tabs[1])
    const repairs = MACHINE_EVENTS.filter((e) => e.machineId === '4' && e.tipo === 'manutencao' && e.data >= DEFAULT_PERIOD.from)
    expect(within(within(dialog).getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(repairs.length)

    fireEvent.click(within(dialog).getByRole('button', { name: /fechar/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('Procurar Máquina')).toHaveValue('EMP-084')
    expect(cards()).toHaveLength(visible)
  })
})

describe('AlertasPage skeleton', () => {
  afterEach(() => {
    loading.value = false
  })

  it('shows the grid skeleton without the search and period while loading', () => {
    loading.value = true
    const { container } = render(<AlertasPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Carregando...')
    expect(container.querySelectorAll('[data-skeleton-card]')).toHaveLength(8)
    expect(screen.queryByPlaceholderText('Procurar Máquina')).not.toBeInTheDocument()
    expect(cards()).toEqual([])
  })

  it('mirrors the panel, label, search and period, with fleet cards in the page grid class', () => {
    loading.value = true
    const { container } = render(<AlertasPage />)
    const panel = container.querySelector(`.${styles.panel}`)!
    const toolbar = panel.querySelector('[data-skeleton-toolbar]')!
    expect(toolbar).toHaveClass(styles.toolbar)
    expect(toolbar.querySelector(`.${styles.filters}`)!.children).toHaveLength(2)
    const grid = panel.querySelector(`.${styles.grid}`)!
    expect(grid.querySelectorAll('[data-skeleton-card] [data-skeleton-part="strip"]')).toHaveLength(8)
    expect(toolbar.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

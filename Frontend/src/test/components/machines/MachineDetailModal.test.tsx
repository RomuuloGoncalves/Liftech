import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MachineDetailModal from '../../../components/machines/MachineDetailModal'
import { DEFAULT_PERIOD, defaultPeriodTo, type Machine, type MachineEvent } from '../../../data/machines'
import { incidentService, type FiltroIncidentes } from '../../../services/incidentService'

vi.mock('../../../services/incidentService', () => ({ incidentService: { listar: vi.fn(), reportar: vi.fn() } }))
const listarIncidentes = vi.mocked(incidentService.listar)

const machine: Machine = {
  id: '4',
  identificacao: 'EMP-084',
  nome: 'Empilhadeira Elétrica Titan-X',
  setor: 'Expedição - Bloco B',
  status: 'disponivel', categoriaId: null, categoriaTravada: false, dispositivoConectado: { enderecoMac: 'A:2C:99:B1:DF:7', nomeDispositivo: 'Mpa-5312' },
  tempoSessaoMinutos: 5,
  tempoUsoTotalHoras: 7,
}

const ev = (over: Partial<MachineEvent>): MachineEvent => ({
  id: 'e',
  machineId: '4',
  tipo: 'acidente',
  operador: 'Alexandre Gomes',
  data: '2025-09-14',
  inicio: '14:35:25',
  fim: '16:35:20',
  ...over,
})

const events = [
  ev({ id: 'a1' }),
  ev({ id: 'a2', operador: 'Carlos Silva', data: '2025-01-10', inicio: '08:00:00', fim: '08:45:00' }),
  ev({ id: 'm1', tipo: 'manutencao', operador: 'Ana Souza', data: '2025-05-20', inicio: '09:00:00', fim: '10:30:00' }),
]

// Stand-in for GET /incidents: the accidents of `events` by local day, inclusive, most recent first.
const listIncidents = async ({ from, to }: FiltroIncidentes = {}) =>
  events
    .filter((e) => e.tipo === 'acidente' && (!from || e.data >= from) && (!to || e.data <= to))
    .sort((a, b) => (b.data + b.inicio).localeCompare(a.data + a.inicio))
    .map((e) => ({
      _id: e.id,
      machineId: e.machineId,
      maquina: null,
      operador: { nome: e.operador },
      dataIncidente: new Date(`${e.data}T${e.inicio}`).toISOString(),
      forcaImpacto: null,
      status: 'pendente',
      origem: 'sensor' as const,
      descricao: null,
    }))

const loaded = () => act(async () => {})

beforeEach(() => listarIncidentes.mockReset().mockImplementation(listIncidents))

function setup(props: Partial<React.ComponentProps<typeof MachineDetailModal>> = {}) {
  const handlers = { onEdit: vi.fn(), onDelete: vi.fn(), onClose: vi.fn() }
  render(<MachineDetailModal machine={machine} events={events} {...handlers} {...props} />)
  return handlers
}

const setDate = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('MachineDetailModal: content', () => {
  it('shows nome, status badge, código and mac', () => {
    setup()

    expect(screen.getByRole('dialog', { name: 'Empilhadeira Elétrica Titan-X' })).toBeInTheDocument()
    expect(screen.getByText('Disponível')).toBeInTheDocument()
    expect(screen.getByText('EMP-084(ID)')).toBeInTheDocument()
    expect(screen.getByText('A:2C:99:B1:DF:7')).toBeInTheDocument()
  })

  it('shows the info card with setor, total usage and device name', () => {
    setup()

    expect(screen.getByText('Setor')).toBeInTheDocument()
    expect(screen.getByText('Expedição - Bloco B')).toBeInTheDocument()
    expect(screen.getByText('Tempo Uso (Total)')).toBeInTheDocument()
    expect(screen.getByText(/^7\s?h/)).toBeInTheDocument()
    expect(screen.getByText('Nome Dispositivo')).toBeInTheDocument()
    expect(screen.getByText('Mpa-5312')).toBeInTheDocument()
  })

  it('shows a dash for missing total usage and device name', () => {
    setup({
      machine: {
        ...machine,
        tempoUsoTotalHoras: undefined,
        status: 'offline', categoriaId: null, categoriaTravada: false, dispositivoConectado: { enderecoMac: 'x' },
      },
    })

    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})

describe('MachineDetailModal: history', () => {
  it('opens on the accidents tab with the API incidents, newest first, with date and time', async () => {
    setup()
    await loaded()

    expect(screen.getByRole('tab', { name: 'Histórico de acidentes' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Histórico de manutenção' })).toHaveAttribute('aria-selected', 'false')
    const items = within(screen.getByRole('tabpanel')).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Alexandre Gomes')
    expect(items[0]).toHaveTextContent('Dom, 14 setembro 2025')
    expect(items[0]).toHaveTextContent('14:35:25')
    expect(items[0]).not.toHaveTextContent('~')
    expect(items[1]).toHaveTextContent('Carlos Silva')
    expect(items[1]).toHaveTextContent('08:00:00')
    expect(listarIncidentes).toHaveBeenCalledWith({ machineId: '4', from: DEFAULT_PERIOD.from, to: defaultPeriodTo() })
  })

  it('switches to maintenance and marks that tab selected', () => {
    setup()

    fireEvent.click(screen.getByRole('tab', { name: 'Histórico de manutenção' }))
    expect(screen.getByRole('tab', { name: 'Histórico de manutenção' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Histórico de acidentes' })).toHaveAttribute('aria-selected', 'false')
    const items = within(screen.getByRole('tabpanel')).getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent('Ana Souza')
    expect(items[0]).toHaveTextContent('(1 hora 30 minutos)')
  })

  it('defaults the period from 14/07/2024 to 14/07/2026 or today, whichever is later', () => {
    setup()

    expect(screen.getByLabelText('Data inicial')).toHaveValue('2024-07-14')
    expect(screen.getByLabelText('Data final')).toHaveValue(['2026-07-14', new Date().toLocaleDateString('sv')].sort()[1])
  })

  it('asks the API for the period, inclusive', async () => {
    setup()

    setDate('Data inicial', '2025-09-14')
    await loaded()
    expect(listarIncidentes).toHaveBeenLastCalledWith({ machineId: '4', from: '2025-09-14', to: defaultPeriodTo() })
    expect(within(screen.getByRole('tabpanel')).getAllByRole('listitem')).toHaveLength(1)
    setDate('Data final', '2025-09-13')
    await loaded()
    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows the empty state when the start date is after the end date', async () => {
    setup()

    setDate('Data inicial', '2026-01-01')
    setDate('Data final', '2025-01-01')
    await loaded()
    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })

  it('shows the empty state when the API has no incident', async () => {
    listarIncidentes.mockResolvedValue([])
    setup({ events: [] })
    await loaded()

    expect(screen.getByText('Nenhum registro no período')).toBeInTheDocument()
  })
})

describe('MachineDetailModal: actions', () => {
  it('calls onEdit and onDelete with the machine', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Máquina' }))
    fireEvent.click(screen.getByRole('button', { name: 'Excluir Máquina' }))
    expect(h.onEdit).toHaveBeenCalledWith(machine)
    expect(h.onDelete).toHaveBeenCalledWith(machine)
  })

  it('closes from the close icon, Escape and the backdrop', () => {
    const h = setup()

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('dialog').parentElement as HTMLElement)
    expect(h.onClose).toHaveBeenCalledTimes(3)
  })
})

describe('MachineDetailModal fleet variant', () => {
  const fleetMachine: Machine = { ...machine, operadorConectado: { nome: 'Alexandre Gomes' }, tempoSessaoMinutos: 34 }

  const setupFleet = () => {
    const onClose = vi.fn()
    render(<MachineDetailModal machine={fleetMachine} events={events} onClose={onClose} variant="fleet" />)
    return onClose
  }

  it('shows Setor, Funcionário, Tempo Uso (Sessão) and Nome Dispositivo rows', () => {
    setupFleet()
    const rows = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(rows).toEqual(
      expect.arrayContaining([
        'SetorExpedição - Bloco B',
        'FuncionárioAlexandre Gomes',
        'Tempo Uso (Sessão)34 minutos',
        'Nome DispositivoMpa-5312',
      ])
    )
    expect(screen.queryByText('Tempo Uso (Total)')).not.toBeInTheDocument()
  })

  it('shows an em dash when the machine has no employee', () => {
    render(<MachineDetailModal machine={machine} events={events} onClose={vi.fn()} variant="fleet" />)
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toContain('Funcionário—')
  })

  it('shows the repair and alert tabs, starting on repairs', async () => {
    setupFleet()
    await loaded()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Histórico de reparos', 'Histórico de alertas'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Ana Souza')).toBeInTheDocument()
    expect(screen.queryByText('Carlos Silva')).not.toBeInTheDocument()

    fireEvent.click(tabs[1])
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument()
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
  })

  it('keeps the period filter', () => {
    setupFleet()
    expect(screen.getByLabelText('Data inicial')).toBeInTheDocument()
    expect(screen.getByLabelText('Data final')).toBeInTheDocument()
  })

  it('has no edit or delete buttons', () => {
    setupFleet()
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
  })
})

describe('MachineDetailModal alerts variant', () => {
  const setupAlerts = () =>
    render(
      <MachineDetailModal
        machine={{ ...machine, operadorConectado: { nome: 'Alexandre Gomes' } }}
        events={events}
        onClose={vi.fn()}
        variant="alerts"
      />
    )

  it('starts on the alerts tab, listed before repairs', async () => {
    setupAlerts()
    await loaded()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Histórico de alertas', 'Histórico de reparos'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument()
    expect(screen.queryByText('Ana Souza')).not.toBeInTheDocument()
  })

  it('shows the fleet rows, without status badge nor edit/delete buttons', () => {
    setupAlerts()
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toContain('FuncionárioAlexandre Gomes')
    expect(screen.queryByText('Disponível')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
  })
})

describe('MachineDetailModal status pill and buttons (RST-06, RST-08)', () => {
  it.each([
    ['disponivel', 'Disponível', 'disponivel'],
    ['em_uso', 'Em uso', 'em_uso'],
    ['manutencao', 'Em manutenção', 'manutencao'],
    ['offline', 'Offline', 'offline'],
    ['alerta', 'Alerta', 'alerta'],
  ] as const)('maps %s to %s', (status, label, cls) => {
    setup({ machine: { ...machine, status } })
    expect(screen.getByText(label).className).toContain(cls)
  })

  it('renders Editar and Excluir with edit and delete classes', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Editar Máquina' }).className).toContain('edit')
    expect(screen.getByRole('button', { name: 'Excluir Máquina' }).className).toContain('delete')
  })
})

describe('MachineDetailModal status and lock', () => {
  it('renders neither control without the props', () => {
    setup()
    expect(screen.queryByLabelText('Alterar status')).toBeNull()
    expect(screen.queryByRole('button', { name: /^(Travar|Destravar)$/ })).toBeNull()
  })

  it('calls onChangeStatus with the chosen code', () => {
    const onChangeStatus = vi.fn()
    setup({ onChangeStatus })
    const select = screen.getByLabelText('Alterar status') as HTMLSelectElement
    expect(select.value).toBe('disponivel')
    expect(select.options).toHaveLength(5)
    fireEvent.change(select, { target: { value: 'manutencao' } })
    expect(onChangeStatus).toHaveBeenCalledWith('manutencao')
  })

  it('shows Travar when unlocked and toggles to true', () => {
    const onToggleLock = vi.fn()
    setup({ onToggleLock })
    fireEvent.click(screen.getByRole('button', { name: 'Travar' }))
    expect(onToggleLock).toHaveBeenCalledWith(true)
  })

  it('shows Destravar when locked and toggles to false', () => {
    const onToggleLock = vi.fn()
    setup({ onToggleLock, machine: { ...machine, categoriaTravada: true } })
    fireEvent.click(screen.getByRole('button', { name: 'Destravar' }))
    expect(onToggleLock).toHaveBeenCalledWith(false)
  })
})

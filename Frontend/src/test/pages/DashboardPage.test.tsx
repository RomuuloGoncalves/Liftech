import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../config/i18n';
import { ToastProvider } from '../../components/common/Toast';
import { ActiveBranchProvider, useActiveBranch } from '../../context/ActiveBranchContext';
import { machineService } from '../../services/machineService';
import { operatorService } from '../../services/operatorService';
import { sessionService } from '../../services/sessionService';
import { heatmapFrom } from '../../utils/heatmap';
import type { Machine } from '../../data/machines';
import type { Employee } from '../../data/team';
import type { Sessao } from '../../services/sessionService';
import DashboardPage from '../../pages/DashboardPage';

vi.mock('../../services/machineService', () => ({
  machineService: {
    listar: vi.fn(),
    criar: vi.fn(),
  },
}));

vi.mock('../../services/operatorService', () => ({
  operatorService: {
    listar: vi.fn(),
  },
}));

vi.mock('../../services/sessionService', () => ({
  sessionService: {
    listar: vi.fn(),
  },
}));

vi.mock('../../services/sectorService', () => ({
  sectorService: {
    listar: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../../services/incidentService', () => ({
  incidentService: {
    listar: vi.fn().mockResolvedValue([]),
  },
}));

const mockMachineList = vi.mocked(machineService.listar);
const mockMachineCreate = vi.mocked(machineService.criar);
const mockOperatorList = vi.mocked(operatorService.listar);
const mockSessionList = vi.mocked(sessionService.listar);

function makeMachine(id: string, status: Machine['status'] = 'disponivel', nome = 'Titan-X'): Machine {
  return {
    id,
    identificacao: `EMP-${id}`,
    nome,
    setor: 'Expedição - Bloco B',
    setorId: 's1',
    status,
    categoriaId: null,
    categoriaTravada: false,
    dispositivoConectado: { enderecoMac: 'AA:BB:CC' },
    tempoSessaoMinutos: 34,
  };
}

function makeEmployee(id: string, nome: string): Employee {
  return {
    id,
    matricula: `MAT-${id}`,
    nome,
    cargo: 'Operador',
    telefone: '123456789',
    horarioEntrada: '08:00',
    horarioSaida: '17:00',
    filialId: 'f1',
    usuario: null,
    acesso: 'Permitido',
  };
}

function makeSession(id: string): Sessao {
  return {
    _id: id,
    machineId: 'm1',
    maquina: { nome: 'Titan-X', identificacao: 'EMP-m1', setor: 'Expedição' },
    operador: { nome: 'Carlos Silva' },
    inicio: new Date(2026, 9, 26, 8, 30).toISOString(),
    fim: null,
  };
}

const mockUser = {
  _id: 'u1',
  nome: 'Admin User',
  role: 'admin',
  empresa: { _id: 'e1', nome: 'Empresa Teste' },
  escopo: 'empresa',
  filiais: [
    { _id: 'f1', nome: 'Filial 01', matriz: true },
    { _id: 'f2', nome: 'Filial 02', matriz: false },
  ],
};

const SwitchBranch = ({ id }: { id: string }) => {
  const { setActiveBranch } = useActiveBranch();
  return <button type="button" onClick={() => setActiveBranch(id)}>switch to {id}</button>;
};

const renderDashboard = (options: { activeBranch?: string } = {}) => {
  if (options.activeBranch) {
    localStorage.setItem('liftech.activeBranch', options.activeBranch);
  }
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ActiveBranchProvider>
          <SwitchBranch id="f1" />
          <SwitchBranch id="f2" />
          <SwitchBranch id="todas" />
          <DashboardPage />
        </ActiveBranchProvider>
      </ToastProvider>
    </MemoryRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('pt-BR');
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(mockUser));
    vi.clearAllMocks();

    mockMachineList.mockResolvedValue([]);
    mockOperatorList.mockResolvedValue([]);
    mockSessionList.mockResolvedValue([]);
    mockMachineCreate.mockImplementation(async (values) => makeMachine('created', 'disponivel', values.nome));
  });

  it('renders quick data cards with counts (3, 2, 1, 1) and Figma labels for 3 machines and 2 operators', async () => {
    const machines: Machine[] = [
      makeMachine('1', 'disponivel'),
      makeMachine('2', 'manutencao'),
      makeMachine('3', 'offline'),
    ];
    const employees: Employee[] = [
      makeEmployee('e1', 'Operador 1'),
      makeEmployee('e2', 'Operador 2'),
    ];

    mockMachineList.mockResolvedValue(machines);
    mockOperatorList.mockResolvedValue(employees);
    mockSessionList.mockResolvedValue([]);

    renderDashboard();

    const card1 = (await screen.findByText('Máquinas cadastradas')).closest('div')!;
    expect(within(card1).getByText('3')).toBeInTheDocument();

    const card2 = screen.getByText('Funcionário cadastrados').closest('div')!;
    expect(within(card2).getByText('2')).toBeInTheDocument();

    const card3 = screen.getByText('Máquinas em manutenção').closest('div')!;
    expect(within(card3).getByText('1')).toBeInTheDocument();

    const card4 = screen.getByText('Máquinas Desativadas').closest('div')!;
    expect(within(card4).getByText('1')).toBeInTheDocument();
  });

  it('calls sessionService.listar with heatmapFrom(today) and active branch filialId, or without filialId when "todas"', async () => {
    mockMachineList.mockResolvedValue([]);
    mockOperatorList.mockResolvedValue([]);
    mockSessionList.mockResolvedValue([]);

    // With active branch f1
    const { unmount } = renderDashboard({ activeBranch: 'f1' });
    await screen.findByText('Máquinas cadastradas');

    const expectedFrom = heatmapFrom(new Date());
    expect(mockSessionList).toHaveBeenCalledWith({ from: expectedFrom, filialId: 'f1' });
    unmount();

    // With active branch todas
    localStorage.setItem('liftech.activeBranch', 'todas');
    renderDashboard({ activeBranch: 'todas' });
    await screen.findByText('Máquinas cadastradas');

    expect(mockSessionList).toHaveBeenCalledWith({ from: expectedFrom, filialId: undefined });
  });

  it('shows aria-busy and no numbers before promises resolve', () => {
    mockMachineList.mockReturnValue(new Promise(() => {}));
    mockOperatorList.mockReturnValue(new Promise(() => {}));
    mockSessionList.mockReturnValue(new Promise(() => {}));

    const { container, unmount } = renderDashboard();

    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText('Máquinas cadastradas')).not.toBeInTheDocument();
    unmount();
  });

  it('isolates operatorService error: employee card shows error with retry while table and other cards render', async () => {
    const machines = [makeMachine('1')];
    mockMachineList.mockResolvedValue(machines);
    mockOperatorList.mockRejectedValueOnce(new Error('Fail operator'));
    mockSessionList.mockResolvedValue([]);

    renderDashboard();

    // Table and machine card are rendered
    expect(await screen.findByText('Máquinas cadastradas')).toBeInTheDocument();
    expect(screen.getByText('Listagem de máquinas')).toBeInTheDocument();

    // Employee card shows error and retry button
    const retryButtons = screen.getAllByRole('button', { name: 'Tentar novamente' });
    expect(retryButtons.length).toBeGreaterThanOrEqual(1);

    // Resolve operator on retry
    mockOperatorList.mockResolvedValueOnce([makeEmployee('e1', 'Ana')]);
    fireEvent.click(retryButtons[0]!);

    expect(await screen.findByText('Funcionário cadastrados')).toBeInTheDocument();
    expect(mockOperatorList).toHaveBeenCalledTimes(2);
  });

  it('isolates sessionService error: heatmap shows error while table remains intact', async () => {
    mockMachineList.mockResolvedValue([makeMachine('1', 'disponivel', 'Empilhadeira Titan')]);
    mockOperatorList.mockResolvedValue([]);
    mockSessionList.mockRejectedValueOnce(new Error('Fail sessions'));

    renderDashboard();

    expect(await screen.findByText('Listagem de máquinas')).toBeInTheDocument();
    const retryBtn = await screen.findByRole('button', { name: 'Tentar novamente' });
    expect(retryBtn).toBeInTheDocument();

    // Table is intact
    expect(screen.getByText('Empilhadeira Titan')).toBeInTheDocument();

    // Retrying sessions fetches again
    mockSessionList.mockResolvedValueOnce([makeSession('s1')]);
    fireEvent.click(retryBtn);

    expect(await screen.findByText('Registro por tempo')).toBeInTheDocument();
    expect(mockSessionList).toHaveBeenCalledTimes(2);
  });

  it('reloads with skeletons and new filialId when active branch changes', async () => {
    mockMachineList.mockResolvedValue([makeMachine('1')]);
    mockOperatorList.mockResolvedValue([]);
    mockSessionList.mockResolvedValue([]);

    const { container } = renderDashboard({ activeBranch: 'f1' });
    await screen.findByText('Listagem de máquinas');

    expect(mockMachineList).toHaveBeenCalledWith('f1');

    // Switch branch to f2
    fireEvent.click(screen.getByText('switch to f2'));

    // Returns to skeleton
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();

    await waitFor(() => expect(mockMachineList).toHaveBeenCalledWith('f2'));
    expect(mockOperatorList).toHaveBeenCalledWith('f2');
    expect(mockSessionList).toHaveBeenCalledWith({ from: heatmapFrom(new Date()), filialId: 'f2' });
  });

  it('creates a machine optimistically, increments card count and shows created toast; rolls back on failure', async () => {
    mockMachineList.mockResolvedValue([makeMachine('1', 'disponivel', 'Original')]);
    mockOperatorList.mockResolvedValue([]);
    mockSessionList.mockResolvedValue([]);

    renderDashboard();

    await screen.findByText('Original');
    const machinesCard = screen.getByText('Máquinas cadastradas').closest('div')!;
    expect(within(machinesCard).getByText('1')).toBeInTheDocument();

    // Open create panel
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }));

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Nova Titan' } });
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-999' } });
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: 'AA:BB:CC:DD:EE' } });

    // Submit successful
    mockMachineCreate.mockResolvedValueOnce(makeMachine('srv-999', 'disponivel', 'Nova Titan'));
    const saveBtn = screen.getByRole('button', { name: 'Salvar' });
    fireEvent.click(saveBtn);

    // Optimistic addition
    await waitFor(() => expect(screen.getByRole('button', { name: 'Nova Titan' })).toBeInTheDocument());
    expect(within(machinesCard).getByText('2')).toBeInTheDocument(); // count increased to 2
    expect(await screen.findByText(/Máquina "EMP-999" cadastrada/i)).toBeInTheDocument();

    // Now test failure on another creation
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }));
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Falha Titan' } });
    fireEvent.change(screen.getByLabelText('ID'), { target: { value: 'EMP-FAIL' } });
    fireEvent.change(screen.getByLabelText('MAC Address'), { target: { value: '11:22:33:44:55' } });

    mockMachineCreate.mockRejectedValueOnce(new Error('Server error'));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    // Line is removed on failure
    await waitFor(() => expect(screen.queryByText('Falha Titan')).not.toBeInTheDocument());
    expect(await screen.findByText(/Não foi possível salvar a máquina/i)).toBeInTheDocument();
  });

  it('opens read-only detail modal when machine name is clicked, without edit or delete buttons', async () => {
    const m = makeMachine('1', 'disponivel', 'Titan-X Click');
    mockMachineList.mockResolvedValue([m]);
    mockOperatorList.mockResolvedValue([]);
    mockSessionList.mockResolvedValue([]);

    renderDashboard();

    const nameBtn = await screen.findByRole('button', { name: 'Titan-X Click' });
    fireEvent.click(nameBtn);

    // Detail modal opens
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('Titan-X Click')).toBeInTheDocument();

    // No edit or delete buttons
    expect(within(dialog).queryByRole('button', { name: 'Editar Máquina' })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('button', { name: 'Excluir Máquina' })).not.toBeInTheDocument();
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { ActiveBranchProvider, useActiveBranch } from '../../context/ActiveBranchContext';
import { AlertsProvider, useAlerts, POLL_INTERVAL_MS } from '../../context/AlertsContext';
import { incidentService, type Incidente } from '../../services/incidentService';
import { authService, type UsuarioLogado } from '../../services/authService';
import '../../components/alerts/AlertModal';

vi.mock('../../services/incidentService', () => ({
  incidentService: {
    listar: vi.fn(),
    reportar: vi.fn(),
  },
}));

vi.mock('../../services/branchService', () => ({
  branchService: {
    listar: vi.fn().mockResolvedValue([]),
    criar: vi.fn(),
    renomear: vi.fn(),
    remover: vi.fn(),
  },
}));

const listar = vi.mocked(incidentService.listar);

const mockUser: UsuarioLogado = {
  _id: 'u1',
  nome: 'Admin User',
  role: 'admin',
  empresa: { _id: 'e1', nome: 'Empresa Teste' },
  escopo: 'filiais',
  filiais: [
    { _id: 'f1', nome: 'Filial 1', matriz: true },
    { _id: 'f2', nome: 'Filial 2', matriz: false },
  ],
};

const makeIncident = (id: string, date = '2026-10-15T12:00:00.000Z'): Incidente => ({
  _id: id,
  machineId: 'm1',
  maquina: { nome: 'Titan', identificacao: 'EMP-084', setor: 'Setor A' },
  operador: { nome: 'Operador A' },
  dataIncidente: date,
  forcaImpacto: null,
  status: 'pendente',
  origem: 'sensor',
  descricao: null,
});

const Consumer = () => {
  const { recent, loading, error, hasUnseen, markSeen, reload, simulate } = useAlerts();
  const { setActiveBranch } = useActiveBranch();

  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{String(error)}</span>
      <span data-testid="hasUnseen">{String(hasUnseen)}</span>
      <span data-testid="recent-count">{recent.length}</span>
      <span data-testid="recent-ids">{recent.map((i) => i._id).join(',')}</span>
      <button onClick={markSeen}>markSeen</button>
      <button onClick={reload}>reload</button>
      <button onClick={simulate}>simulate</button>
      <button onClick={() => setActiveBranch('f1')}>branch-f1</button>
      <button onClick={() => setActiveBranch('f2')}>branch-f2</button>
      <button onClick={() => setActiveBranch('todas')}>branch-todas</button>
    </div>
  );
};

const renderWithProviders = async () => {
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(
      <MemoryRouter>
        <ActiveBranchProvider>
          <AlertsProvider>
            <Consumer />
          </AlertsProvider>
        </ActiveBranchProvider>
      </MemoryRouter>
    );
  });
  return result!;
};

describe('AlertsContext', () => {
  let visibilityGetter: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorage.clear();
    localStorage.setItem('user', JSON.stringify(mockUser));
    vi.spyOn(authService, 'getSession').mockReturnValue(mockUser);

    visibilityGetter = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    listar.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('1 chamada na montagem e +1 após 15 000 ms, nenhuma a 14 999 ms', async () => {
    await renderWithProviders();

    expect(listar).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS - 1);
    });
    expect(listar).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('com visibilityState: "hidden" o intervalo não chama', async () => {
    await renderWithProviders();
    expect(listar).toHaveBeenCalledTimes(1);

    visibilityGetter.mockReturnValue('hidden');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    });

    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('o evento visibilitychange para visible chama na hora', async () => {
    visibilityGetter.mockReturnValue('hidden');
    await renderWithProviders();
    expect(listar).toHaveBeenCalledTimes(0);

    visibilityGetter.mockReturnValue('visible');
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(listar).toHaveBeenCalledTimes(1);
  });

  it('filial ativa f1 envia params.filialId === "f1"', async () => {
    localStorage.setItem('liftech.activeBranch', 'f1');
    await renderWithProviders();

    expect(listar).toHaveBeenCalledWith({ filialId: 'f1' });
  });

  it('filial ativa "todas" não envia filialId', async () => {
    localStorage.setItem('liftech.activeBranch', 'todas');
    await renderWithProviders();

    expect(listar).toHaveBeenCalledWith({});
  });

  it('troca de filial dispara nova chamada com o novo filialId', async () => {
    localStorage.setItem('liftech.activeBranch', 'f1');
    await renderWithProviders();
    expect(listar).toHaveBeenCalledWith({ filialId: 'f1' });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'branch-f2' }));
    });

    expect(listar).toHaveBeenCalledWith({ filialId: 'f2' });
  });

  it('sem sessão de usuário: 0 chamadas', async () => {
    vi.spyOn(authService, 'getSession').mockReturnValue(null);
    localStorage.removeItem('user');

    await renderWithProviders();

    expect(listar).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2);
    });
    expect(listar).not.toHaveBeenCalled();
  });

  it('7 incidentes retorna recent com os 5 primeiros na ordem recebida', async () => {
    const items = ['1', '2', '3', '4', '5', '6', '7'].map((id) => makeIncident(id));
    listar.mockResolvedValue(items);

    await renderWithProviders();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('recent-count')).toHaveTextContent('5');
    expect(screen.getByTestId('recent-ids')).toHaveTextContent('1,2,3,4,5');
  });

  it('loading é true antes da resposta e false depois', async () => {
    let resolvePromise: (value: Incidente[]) => void;
    const promise = new Promise<Incidente[]>((resolve) => {
      resolvePromise = resolve;
    });
    listar.mockReturnValue(promise);

    await renderWithProviders();

    expect(screen.getByTestId('loading')).toHaveTextContent('true');

    await act(async () => {
      resolvePromise!([]);
      await promise;
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('falha define error: true com recent anterior mantido, e sucesso seguinte reseta error: false', async () => {
    listar.mockResolvedValueOnce([makeIncident('i1')]);
    await renderWithProviders();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('false');
    expect(screen.getByTestId('recent-ids')).toHaveTextContent('i1');

    listar.mockRejectedValueOnce(new Error('Network error'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByTestId('error')).toHaveTextContent('true');
    expect(screen.getByTestId('recent-ids')).toHaveTextContent('i1');

    listar.mockResolvedValueOnce([makeIncident('i2')]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByTestId('error')).toHaveTextContent('false');
    expect(screen.getByTestId('recent-ids')).toHaveTextContent('i2');
  });

  it('reload() consulta na hora sem esperar o intervalo', async () => {
    await renderWithProviders();
    expect(listar).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'reload' }));
    });

    expect(listar).toHaveBeenCalledTimes(2);
  });

  it('hasUnseen é true com ids não vistos e false após markSeen(), gravando no localStorage', async () => {
    const items = [makeIncident('i1'), makeIncident('i2')];
    listar.mockResolvedValue(items);

    await renderWithProviders();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('hasUnseen')).toHaveTextContent('true');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'markSeen' }));
    });

    expect(screen.getByTestId('hasUnseen')).toHaveTextContent('false');
    expect(localStorage.getItem('liftech.alerts.seen.u1')).toBe(JSON.stringify(['i1', 'i2']));
  });

  it('com localStorage.getItem/setItem lançando erro, monta e markSeen() deixa hasUnseen: false', async () => {
    listar.mockResolvedValue([makeIncident('i1')]);

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      if (key.startsWith('liftech.alerts.seen')) throw new Error('Blocked');
      if (key === 'user') return JSON.stringify(mockUser);
      return null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
      if (key.startsWith('liftech.alerts.seen')) throw new Error('Blocked');
    });

    await renderWithProviders();

    await act(async () => {
      await Promise.resolve();
    });

    expect(screen.getByTestId('hasUnseen')).toHaveTextContent('true');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'markSeen' }));
    });

    expect(screen.getByTestId('hasUnseen')).toHaveTextContent('false');
  });

  it('primeira resposta com 2 incidentes: define linha de base e não abre nenhum alertdialog', async () => {
    listar.mockResolvedValueOnce([makeIncident('i1'), makeIncident('i2')]);
    await renderWithProviders();

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('segunda resposta com 1 id novo abre modal com setor, operador e identificação, Ok fecha e terceira resposta não reabre', async () => {
    listar.mockResolvedValueOnce([makeIncident('i1')]);
    await renderWithProviders();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    const novo: Incidente = {
      ...makeIncident('i2'),
      maquina: { nome: 'Titan', identificacao: 'EMP-084(ID)', setor: 'Expedição - Bloco B' },
      operador: { nome: 'Alexandre Mattos' },
    };
    listar.mockResolvedValueOnce([novo, makeIncident('i1')]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    const modal = screen.getByRole('alertdialog');
    expect(modal).toHaveTextContent('Expedição - Bloco B');
    expect(modal).toHaveTextContent('Alexandre Mattos');
    expect(modal).toHaveTextContent('EMP-084(ID)');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    listar.mockResolvedValueOnce([novo, makeIncident('i1')]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('pressionar Esc fecha o modal igual ao Ok', async () => {
    listar.mockResolvedValueOnce([makeIncident('i1')]);
    await renderWithProviders();

    listar.mockResolvedValueOnce([makeIncident('i2'), makeIncident('i1')]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('dois ids novos na mesma resposta: abre o de dataIncidente mais antigo e, após Ok, o mais novo', async () => {
    listar.mockResolvedValueOnce([makeIncident('i1')]);
    await renderWithProviders();

    const maisAntigo: Incidente = {
      ...makeIncident('i2', '2026-10-15T10:00:00.000Z'),
      maquina: { nome: 'Titan', identificacao: 'EMP-001', setor: 'Setor 1' },
    };
    const maisNovo: Incidente = {
      ...makeIncident('i3', '2026-10-15T11:00:00.000Z'),
      maquina: { nome: 'Titan', identificacao: 'EMP-002', setor: 'Setor 2' },
    };
    listar.mockResolvedValueOnce([maisNovo, maisAntigo, makeIncident('i1')]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByRole('alertdialog')).toHaveTextContent('EMP-001');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    });

    expect(screen.getByRole('alertdialog')).toHaveTextContent('EMP-002');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('id novo chegando com modal aberto: só aparece após o Ok do atual', async () => {
    listar.mockResolvedValueOnce([makeIncident('i1')]);
    await renderWithProviders();

    const primeiro: Incidente = {
      ...makeIncident('i2'),
      maquina: { nome: 'Titan', identificacao: 'EMP-001', setor: 'Setor 1' },
    };
    listar.mockResolvedValueOnce([primeiro, makeIncident('i1')]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByRole('alertdialog')).toHaveTextContent('EMP-001');

    const segundo: Incidente = {
      ...makeIncident('i3'),
      maquina: { nome: 'Titan', identificacao: 'EMP-002', setor: 'Setor 2' },
    };
    listar.mockResolvedValueOnce([segundo, primeiro, makeIncident('i1')]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByRole('alertdialog')).toHaveTextContent('EMP-001');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    });

    expect(screen.getByRole('alertdialog')).toHaveTextContent('EMP-002');
  });

  it('primeira resposta falha e a segunda traz 2 incidentes: nenhum modal aberto', async () => {
    listar.mockRejectedValueOnce(new Error('Network error'));
    await renderWithProviders();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    listar.mockResolvedValueOnce([makeIncident('i1'), makeIncident('i2')]);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('troca de filial: a primeira resposta da nova filial não abre modal', async () => {
    localStorage.setItem('liftech.activeBranch', 'f1');
    listar.mockResolvedValueOnce([makeIncident('i1')]);
    await renderWithProviders();

    listar.mockResolvedValueOnce([makeIncident('i2_f2'), makeIncident('i3_f2')]);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'branch-f2' }));
    });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('simulate() abre modal com Expedição - Bloco B, Alexandre Mattos e EMP-084(ID) sem chamar listar', async () => {
    await renderWithProviders();
    const chamadasAntes = listar.mock.calls.length;

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'simulate' }));
    });

    const modal = screen.getByRole('alertdialog');
    expect(modal).toHaveTextContent('Expedição - Bloco B');
    expect(modal).toHaveTextContent('Alexandre Mattos');
    expect(modal).toHaveTextContent('EMP-084(ID)');
    expect(listar.mock.calls.length).toBe(chamadasAntes);
  });

  it('simulate() duas vezes enfileira dois modais em sequência', async () => {
    await renderWithProviders();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'simulate' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'simulate' }));
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    });

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('falha de consulta com modal aberto mantém o modal aberto', async () => {
    await renderWithProviders();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'simulate' }));
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();

    listar.mockRejectedValueOnce(new Error('Network error'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
    });

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});

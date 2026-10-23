import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AlertsDropdown, {
  type AlertsContextValue,
} from '../../../components/layout/AlertsDropdown';
import type { Incidente } from '../../../services/incidentService';

function makeIncident(id: string, name?: string | null): Incidente {
  return {
    _id: id,
    machineId: `m-${id}`,
    maquina:
      name !== undefined
        ? name
          ? { nome: name, identificacao: `ID-${id}`, setor: 'Setor A' }
          : null
        : { nome: `Máquina ${id}`, identificacao: `ID-${id}`, setor: 'Setor A' },
    operador: { nome: 'Operador Teste' },
    dataIncidente: new Date().toISOString(),
    forcaImpacto: 10,
    status: 'pendente',
    origem: 'sensor',
    descricao: 'Impacto detectado',
  };
}

function makeContextValue(overrides: Partial<AlertsContextValue> = {}): AlertsContextValue {
  return {
    recent: [],
    loading: false,
    error: false,
    hasUnseen: false,
    markSeen: vi.fn(),
    reload: vi.fn(),
    simulate: vi.fn(),
    ...overrides,
  };
}

function renderAlertsDropdown(
  contextValue: AlertsContextValue,
  initialEntries = ['/']
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route
          path="/"
          element={<AlertsDropdown alerts={contextValue} />}
        />
        <Route
          path="/alertas"
          element={<div data-testid="alertas-page">Página de Alertas</div>}
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('AlertsDropdown component (T2: popover, estados e navegação)', () => {
  it('ALR-01: opens popover on bell click and renders 2 rows for 2 items', () => {
    const twoItems = [
      makeIncident('1', 'Empilhadeira Alfa'),
      makeIncident('2', 'Empilhadeira Beta'),
    ];
    renderAlertsDropdown(makeContextValue({ recent: twoItems }));

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.getByRole('dialog', { name: 'Alertas Recentes' })).toBeInTheDocument();
    expect(screen.getByText('Empilhadeira Alfa')).toBeInTheDocument();
    expect(screen.getByText('Empilhadeira Beta')).toBeInTheDocument();
  });

  it('ALR-01: shows only the first 5 items when recent has 7 items', () => {
    const sevenItems = Array.from({ length: 7 }, (_, i) =>
      makeIncident(String(i + 1), `Empilhadeira ${i + 1}`)
    );
    renderAlertsDropdown(makeContextValue({ recent: sevenItems }));

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(`Empilhadeira ${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByText('Empilhadeira 6')).not.toBeInTheDocument();
    expect(screen.queryByText('Empilhadeira 7')).not.toBeInTheDocument();
  });

  it('ALR-02: clicking title "Alertas Recentes" navigates to /alertas and closes popover', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Alertas Recentes' }));

    expect(screen.getByTestId('alertas-page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
  });

  it('ALR-02: clicking an incident row navigates to /alertas and closes popover', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    fireEvent.click(screen.getByText('Empilhadeira Alfa'));

    expect(screen.getByTestId('alertas-page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
  });

  it('ALR-02: clicking "Mais" button navigates to /alertas and closes popover', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Mais' }));

    expect(screen.getByTestId('alertas-page')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
  });

  it('ALR-03: closes popover when close (X) button is clicked', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
    });
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bell);
    expect(screen.getByRole('dialog', { name: 'Alertas Recentes' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Fechar alertas recentes' }));
    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
  });

  it('ALR-03: closes popover when clicking outside (mousedown on document)', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    expect(screen.getByRole('dialog', { name: 'Alertas Recentes' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
  });

  it('ALR-03: closes popover when Escape key is pressed', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    expect(screen.getByRole('dialog', { name: 'Alertas Recentes' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
  });

  it('ALR-03: closes popover when clicking the bell again', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
    });
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bell);
    expect(screen.getByRole('dialog', { name: 'Alertas Recentes' })).toBeInTheDocument();

    fireEvent.click(bell);
    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
  });

  it('ALR-05: calls markSeen() once upon opening', () => {
    const markSeen = vi.fn();
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
      markSeen,
    });
    renderAlertsDropdown(ctx);

    expect(markSeen).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    expect(markSeen).toHaveBeenCalledTimes(1);
  });

  it('ALR-05: does not call markSeen() again when recent changes while open', () => {
    const markSeen = vi.fn();
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
      markSeen,
    });

    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <AlertsDropdown alerts={ctx} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));
    expect(markSeen).toHaveBeenCalledTimes(1);

    const updatedCtx = {
      ...ctx,
      recent: [makeIncident('2', 'Empilhadeira Beta'), makeIncident('1', 'Empilhadeira Alfa')],
    };

    rerender(
      <MemoryRouter initialEntries={['/']}>
        <AlertsDropdown alerts={updatedCtx} />
      </MemoryRouter>
    );

    expect(markSeen).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Empilhadeira Beta')).toBeInTheDocument();
  });

  it('ALR-06: shows "Nenhum alerta recente" when recent is empty, not loading and not error', () => {
    const ctx = makeContextValue({ recent: [], loading: false, error: false });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.getByText('Nenhum alerta recente')).toBeInTheDocument();
  });

  it('ALR-07: shows error message with retry button calling reload()', () => {
    const reload = vi.fn();
    const ctx = makeContextValue({
      recent: [],
      error: true,
      reload,
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.getByText('Não foi possível carregar os alertas')).toBeInTheDocument();

    const retryBtn = screen.getByRole('button', { name: 'Tentar de novo' });
    fireEvent.click(retryBtn);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('ALR-07: error state hides the incident list even when recent has items', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
      error: true,
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.getByText('Não foi possível carregar os alertas')).toBeInTheDocument();
    expect(screen.queryByText('Empilhadeira Alfa')).not.toBeInTheDocument();
  });

  it('ALR-09: shows "Carregando alertas…" when recent is empty and loading is true', () => {
    const ctx = makeContextValue({ recent: [], loading: true });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.getByText('Carregando alertas…')).toBeInTheDocument();
  });

  it('ALR-09: keeps showing the list when recent has items and loading is true', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', 'Empilhadeira Alfa')],
      loading: true,
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.queryByText('Carregando alertas…')).not.toBeInTheDocument();
    expect(screen.getByText('Empilhadeira Alfa')).toBeInTheDocument();
  });

  it('ALR-10: writes "Máquina não informada" when maquina is null', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('1', null)],
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.getByText('Máquina não informada')).toBeInTheDocument();
  });

  it('ALR-10: writes "Máquina não informada" when maquina nome is empty', () => {
    const ctx = makeContextValue({
      recent: [makeIncident('2', '')],
    });
    renderAlertsDropdown(ctx);

    fireEvent.click(screen.getByRole('button', { name: /notificações/i }));

    expect(screen.getByText('Máquina não informada')).toBeInTheDocument();
  });
});

describe('AlertsDropdown component (T3: ponto de não vistos e acessibilidade do sino)', () => {
  it('ALR-04: shows red dot on bell when hasUnseen is true', () => {
    const ctx = makeContextValue({ hasUnseen: true });
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: /notificações/i });
    const dot = bell.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  it('ALR-04: hides red dot on bell when hasUnseen is false', () => {
    const ctx = makeContextValue({ hasUnseen: false });
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: /notificações/i });
    const dot = bell.querySelector('span[aria-hidden="true"]');
    expect(dot).not.toBeInTheDocument();
  });

  it('ALR-08: bell accessible label is "Notificações" when hasUnseen is false', () => {
    const ctx = makeContextValue({ hasUnseen: false });
    renderAlertsDropdown(ctx);

    expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument();
  });

  it('ALR-08: bell accessible label is "Notificações (há alertas novos)" when hasUnseen is true', () => {
    const ctx = makeContextValue({ hasUnseen: true });
    renderAlertsDropdown(ctx);

    expect(
      screen.getByRole('button', { name: 'Notificações (há alertas novos)' })
    ).toBeInTheDocument();
  });

  it('ALR-08: aria-expanded toggles false -> true -> false on open and close', () => {
    const ctx = makeContextValue({ hasUnseen: false });
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: 'Notificações' });
    expect(bell).toHaveAttribute('aria-expanded', 'false');
    expect(bell).toHaveAttribute('aria-haspopup', 'dialog');

    fireEvent.click(bell);
    expect(bell).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Fechar alertas recentes' }));
    expect(bell).toHaveAttribute('aria-expanded', 'false');
  });

  it('ALR-08: focus returns to bell button when popover is closed via X', () => {
    const ctx = makeContextValue();
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bell);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar alertas recentes' }));
    expect(document.activeElement).toBe(bell);
  });

  it('ALR-08: focus returns to bell button when popover is closed via Esc', () => {
    const ctx = makeContextValue();
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bell);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.activeElement).toBe(bell);
  });

  it('ALR-08: focus does not move to bell when closed via click outside', () => {
    const ctx = makeContextValue();
    renderAlertsDropdown(ctx);

    const bell = screen.getByRole('button', { name: /notificações/i });
    fireEvent.click(bell);

    document.body.focus();
    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('dialog', { name: 'Alertas Recentes' })).not.toBeInTheDocument();
    expect(document.activeElement).not.toBe(bell);
  });
});

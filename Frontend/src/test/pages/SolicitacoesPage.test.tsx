import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SolicitacoesPage from '../../pages/SolicitacoesPage';
import { accessRequestService, type AccessRequest } from '../../services/accessRequestService';
import { ToastProvider } from '../../components/common/Toast';

vi.mock('../../services/accessRequestService', () => ({
  accessRequestService: {
    listar: vi.fn(),
    aprovar: vi.fn(),
    recusar: vi.fn(),
  },
}));

const mockListar = vi.mocked(accessRequestService.listar);
const mockAprovar = vi.mocked(accessRequestService.aprovar);
const mockRecusar = vi.mocked(accessRequestService.recusar);

const pendingRequests: AccessRequest[] = [
  {
    _id: 'p1',
    email: 'admin1@alpha.com',
    nomeEmpresa: 'Alpha Logistics',
    nomeAdministrador: 'Alice Alpha',
    status: 'pendente',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
  {
    _id: 'p2',
    email: 'admin2@beta.com',
    nomeEmpresa: 'Beta Cargo',
    nomeAdministrador: 'Bob Beta',
    status: 'pendente',
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: '2026-10-21T10:00:00.000Z',
  },
];

const approvedRequests: AccessRequest[] = [
  {
    _id: 'a1',
    email: 'admin3@gamma.com',
    nomeEmpresa: 'Gamma Trans',
    nomeAdministrador: 'George Gamma',
    status: 'aprovada',
    empresaId: 'c-gamma',
    decididaEm: '2026-10-22T10:00:00.000Z',
    createdAt: '2026-10-19T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
  },
];

const rejectedRequests: AccessRequest[] = [
  {
    _id: 'r1',
    email: 'admin4@delta.com',
    nomeEmpresa: 'Delta Express',
    nomeAdministrador: 'David Delta',
    status: 'recusada',
    motivoRecusa: 'CNPJ inválido',
    decididaEm: '2026-10-22T11:00:00.000Z',
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-22T11:00:00.000Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <SolicitacoesPage />
      </ToastProvider>
    </MemoryRouter>
  );
}

describe('SolicitacoesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens on Pendentes tab, calls listar("pendente") and renders cards (ACCR-02 AC4)', async () => {
    mockListar.mockResolvedValue(pendingRequests);

    renderPage();

    const pendingTab = screen.getByRole('tab', { name: /Pendentes/i });
    expect(pendingTab).toHaveAttribute('aria-selected', 'true');

    expect(mockListar).toHaveBeenCalledWith('pendente');
    expect(await screen.findByText('Alpha Logistics')).toBeInTheDocument();
    expect(screen.getByText('Beta Cargo')).toBeInTheDocument();
    expect(screen.getByText('admin1@alpha.com')).toBeInTheDocument();
  });

  it('clicking Aprovadas tab calls listar("aprovada") and switches view (ACCR-02 AC5)', async () => {
    mockListar.mockImplementation(async (status) =>
      status === 'aprovada' ? approvedRequests : pendingRequests
    );

    renderPage();

    expect(await screen.findByText('Alpha Logistics')).toBeInTheDocument();

    const approvedTab = screen.getByRole('tab', { name: /Aprovadas/i });
    fireEvent.click(approvedTab);

    expect(approvedTab).toHaveAttribute('aria-selected', 'true');
    expect(mockListar).toHaveBeenCalledWith('aprovada');

    expect(await screen.findByText('Gamma Trans')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Logistics')).not.toBeInTheDocument();
  });

  it('shows empty message for tab when requests list is empty (ACCR-02 AC6)', async () => {
    mockListar.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText(/Nenhuma solicitação pendente/i)).toBeInTheDocument();
  });

  it('shows skeleton while loading and error with Tentar novamente on fetch failure (ACCR-02 AC7)', async () => {
    let rejectPromise!: () => void;
    mockListar.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectPromise = () => reject(new Error('Network error'));
      })
    );

    renderPage();

    // Skeleton loading indicator is active
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();

    // Trigger failure
    rejectPromise();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Não foi possível carregar as solicitações/i)).toBeInTheDocument();

    // Clicking retry fetches again
    mockListar.mockResolvedValueOnce(pendingRequests);
    fireEvent.click(screen.getByRole('button', { name: /Tentar novamente/i }));

    expect(await screen.findByText('Alpha Logistics')).toBeInTheDocument();
  });

  it('keeps the initial password modal open when a second confirm click answers 409 (double click)', async () => {
    mockListar.mockResolvedValue(pendingRequests);
    let resolveFirst: (value: Awaited<ReturnType<typeof accessRequestService.aprovar>>) => void = () => {};
    mockAprovar.mockReturnValueOnce(new Promise((resolve) => { resolveFirst = resolve; }));

    renderPage();
    await screen.findByText('Alpha Logistics');
    fireEvent.click(screen.getAllByRole('button', { name: /Aceitar/i })[0]);
    const dialog = screen.getByRole('dialog', { name: /Aceitar solicitação/i });
    const confirm = within(dialog).getByRole('button', { name: /Aceitar/i });

    fireEvent.click(confirm);
    fireEvent.click(confirm);
    expect(mockAprovar).toHaveBeenCalledTimes(1);

    resolveFirst({ ...pendingRequests[0], status: 'aprovada', senhaInicial: 'secret123456' });
    expect(await screen.findByRole('dialog', { name: /Senha inicial/i })).toBeInTheDocument();
  });

  it('accepts request: shows ConfirmDialog, calls aprovar on confirm, removes card and opens InitialPasswordModal (ACCR-05 AC9)', async () => {
    mockListar.mockResolvedValue(pendingRequests);
    mockAprovar.mockResolvedValue({
      ...pendingRequests[0],
      status: 'aprovada',
      empresaId: 'comp-1',
      decididaEm: '2026-10-23T10:00:00.000Z',
      senhaInicial: 'secret123456',
    });

    renderPage();

    expect(await screen.findByText('Alpha Logistics')).toBeInTheDocument();

    const acceptButtons = screen.getAllByRole('button', { name: /Aceitar/i });
    fireEvent.click(acceptButtons[0]);

    // Confirm dialog is visible
    const dialog = screen.getByRole('dialog', { name: /Aceitar solicitação/i });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/Alpha Logistics/i)).toBeInTheDocument();

    // Cancel does not call aprovar
    fireEvent.click(within(dialog).getByRole('button', { name: /Cancelar/i }));
    expect(mockAprovar).not.toHaveBeenCalled();

    // Reopen and confirm
    const acceptButtonsAgain = screen.getAllByRole('button', { name: /Aceitar/i });
    fireEvent.click(acceptButtonsAgain[0]);

    const reopenedDialog = screen.getByRole('dialog', { name: /Aceitar solicitação/i });
    const confirmBtn = within(reopenedDialog).getByRole('button', { name: /Aceitar/i });
    fireEvent.click(confirmBtn);

    expect(mockAprovar).toHaveBeenCalledWith('p1');

    // Card p1 is removed from view
    await waitFor(() => {
      expect(screen.queryByText('Alpha Logistics')).not.toBeInTheDocument();
      expect(within(screen.getByRole('tabpanel')).queryByText('admin1@alpha.com')).not.toBeInTheDocument();
    });
    // Beta Cargo remains
    expect(screen.getByText('Beta Cargo')).toBeInTheDocument();

    // Password modal opened with initial password
    expect(await screen.findByText(/Senha inicial gerada/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('secret123456')).toBeInTheDocument();
  });

  it('handles 409 conflict email, 409 conflict company, and 500 error on accept, keeping the card in list (ACCR-05 AC10)', async () => {
    mockListar.mockResolvedValue([pendingRequests[0]]);

    // 1. Conflict email
    mockAprovar.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: 'Já existe um usuário com este e-mail.' },
      },
    });

    renderPage();

    expect(await screen.findByText('Alpha Logistics')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Aceitar/i }));

    const dialog1 = screen.getByRole('dialog', { name: /Aceitar solicitação/i });
    fireEvent.click(within(dialog1).getByRole('button', { name: /Aceitar/i }));

    expect(await screen.findByText(/Já existe um usuário com este e-mail/i)).toBeInTheDocument();
    expect(screen.getByText('Alpha Logistics')).toBeInTheDocument();

    // 2. Conflict company
    mockAprovar.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: 'Já existe uma empresa com este nome.' },
      },
    });

    fireEvent.click(screen.getByRole('button', { name: /Aceitar/i }));
    const dialog2 = screen.getByRole('dialog', { name: /Aceitar solicitação/i });
    fireEvent.click(within(dialog2).getByRole('button', { name: /Aceitar/i }));

    expect(await screen.findByText(/Já existe uma empresa com este nome/i)).toBeInTheDocument();
    expect(screen.getByText('Alpha Logistics')).toBeInTheDocument();

    // 3. Generic 500
    mockAprovar.mockRejectedValueOnce(new Error('Internal server error'));

    fireEvent.click(screen.getByRole('button', { name: /Aceitar/i }));
    const dialog3 = screen.getByRole('dialog', { name: /Aceitar solicitação/i });
    fireEvent.click(within(dialog3).getByRole('button', { name: /Aceitar/i }));

    expect(await screen.findByText(/Não foi possível salvar a solicitação/i)).toBeInTheDocument();
    expect(screen.getByText('Alpha Logistics')).toBeInTheDocument();
  });

  it('rejects request: shows RejectDialog, calls recusar(id, motivo), removes card and shows toast; failure keeps card (ACCR-07 AC5/AC6)', async () => {
    mockListar.mockResolvedValue(pendingRequests);
    mockRecusar.mockResolvedValueOnce({
      ...pendingRequests[0],
      status: 'recusada',
      motivoRecusa: 'Documentação ausente',
      decididaEm: '2026-10-23T10:00:00.000Z',
    });

    renderPage();

    expect(await screen.findByText('Alpha Logistics')).toBeInTheDocument();

    const rejectButtons = screen.getAllByRole('button', { name: /Recusar/i });
    fireEvent.click(rejectButtons[0]);

    // RejectDialog is visible
    const dialog = screen.getByRole('dialog', { name: /Recusar solicitação/i });
    expect(dialog).toBeInTheDocument();

    const textarea = within(dialog).getByLabelText(/Motivo da recusa/i);
    fireEvent.change(textarea, { target: { value: 'Documentação ausente' } });

    fireEvent.click(within(dialog).getByRole('button', { name: /Recusar/i }));

    expect(mockRecusar).toHaveBeenCalledWith('p1', 'Documentação ausente');
    expect(await screen.findByText(/Solicitação recusada com sucesso/i)).toBeInTheDocument();

    // Card p1 is removed
    await waitFor(() => {
      expect(screen.queryByText('admin1@alpha.com')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Beta Cargo')).toBeInTheDocument();

    // Failure on reject keeps card
    mockRecusar.mockRejectedValueOnce(new Error('Server error'));
    fireEvent.click(screen.getByRole('button', { name: /Recusar/i }));
    const failDialog = screen.getByRole('dialog', { name: /Recusar solicitação/i });
    fireEvent.click(within(failDialog).getByRole('button', { name: /Recusar/i }));

    expect(await screen.findByText(/Não foi possível salvar a solicitação/i)).toBeInTheDocument();
    expect(screen.getByText('Beta Cargo')).toBeInTheDocument();
  });

  it('handles 409 already decided: shows toast and refetches list (Edge case)', async () => {
    mockListar.mockResolvedValue(pendingRequests);
    mockAprovar.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { error: 'Solicitação já decidida.' },
      },
    });

    renderPage();

    expect(await screen.findByText('Alpha Logistics')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Aceitar/i })[0]);

    const dialog = screen.getByRole('dialog', { name: /Aceitar solicitação/i });
    fireEvent.click(within(dialog).getByRole('button', { name: /Aceitar/i }));

    expect(await screen.findByText(/Esta solicitação já foi decidida/i)).toBeInTheDocument();
    // list was called again
    await waitFor(() => {
      expect(mockListar).toHaveBeenCalledTimes(2);
    });
  });

  it('cards on Aprovadas and Recusadas tabs do not have accept or reject buttons', async () => {
    mockListar.mockImplementation(async (status) => {
      if (status === 'aprovada') return approvedRequests;
      if (status === 'recusada') return rejectedRequests;
      return pendingRequests;
    });

    renderPage();

    // Click Aprovadas
    const approvedTab = screen.getByRole('tab', { name: /Aprovadas/i });
    fireEvent.click(approvedTab);

    expect(await screen.findByText('Gamma Trans')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aceitar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Recusar/i })).not.toBeInTheDocument();

    // Click Recusadas
    const rejectedTab = screen.getByRole('tab', { name: /Recusadas/i });
    fireEvent.click(rejectedTab);

    expect(await screen.findByText('Delta Express')).toBeInTheDocument();
    expect(screen.getByText('CNPJ inválido')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Aceitar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Recusar/i })).not.toBeInTheDocument();
  });
});

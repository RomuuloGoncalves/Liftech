import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ProfileModal from '../../../components/layout/ProfileModal';
import { authService } from '../../../services/authService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../services/authService', () => ({
  authService: {
    getSession: vi.fn(),
    logout: vi.fn(),
    atualizarConta: vi.fn(),
    excluirConta: vi.fn(),
  },
}));

function renderProfileModal(onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <MemoryRouter>
        <ProfileModal onClose={onClose} />
      </MemoryRouter>
    ),
  };
}

describe('ProfileModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('abre com título Perfil, e-mail da sessão, senha mascarada, Excluir Conta e Deslogar-se sem botão de mostrar senha', () => {
    vi.mocked(authService.getSession).mockReturnValue({
      _id: '1',
      nome: 'Admin User',
      role: 'admin',
      email: 'admin@empresa.com',
    });

    renderProfileModal();

    expect(screen.getByRole('heading', { name: /perfil/i })).toBeInTheDocument();
    expect(screen.getByText('admin@empresa.com')).toBeInTheDocument();
    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /excluir conta/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /deslogar-se/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/mostrar senha/i)).not.toBeInTheDocument();
  });

  it('mostra — na linha Email quando a sessão não tem email', () => {
    vi.mocked(authService.getSession).mockReturnValue({
      _id: '1',
      nome: 'Admin User',
      role: 'admin',
    });

    renderProfileModal();

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('lápis têm nomes acessíveis Editar e-mail e Editar senha', () => {
    vi.mocked(authService.getSession).mockReturnValue({
      _id: '1',
      nome: 'Admin User',
      role: 'admin',
      email: 'admin@empresa.com',
    });

    renderProfileModal();

    expect(screen.getByRole('button', { name: /editar e-mail/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /editar senha/i })).toBeInTheDocument();
  });

  it('lápis de e-mail abre modal de edição e volta com o novo e-mail no sucesso', async () => {
    vi.mocked(authService.getSession).mockReturnValue({
      _id: '1',
      nome: 'Admin User',
      role: 'admin',
      email: 'admin@empresa.com',
    });
    vi.mocked(authService.atualizarConta).mockResolvedValue(undefined);

    renderProfileModal();

    fireEvent.click(screen.getByRole('button', { name: /editar e-mail/i }));

    expect(screen.getByRole('heading', { name: /editar e-mail/i })).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    fireEvent.change(screen.getByLabelText(/novo e-mail/i), {
      target: { value: 'novo@empresa.com' },
    });
    fireEvent.change(screen.getByLabelText(/senha atual/i), {
      target: { value: 'senha123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await screen.findByRole('heading', { name: /perfil/i });
    expect(screen.getByText('novo@empresa.com')).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('cancelar no modal de edição volta ao Perfil e mantém apenas um dialog', () => {
    vi.mocked(authService.getSession).mockReturnValue({
      _id: '1',
      nome: 'Admin User',
      role: 'admin',
      email: 'admin@empresa.com',
    });

    renderProfileModal();

    fireEvent.click(screen.getByRole('button', { name: /editar senha/i }));
    expect(screen.getByRole('heading', { name: /editar senha/i })).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(screen.getByRole('heading', { name: /perfil/i })).toBeInTheDocument();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
  });

  it('Excluir Conta abre o modo excluir', () => {
    vi.mocked(authService.getSession).mockReturnValue({
      _id: '1',
      nome: 'Admin User',
      role: 'admin',
      email: 'admin@empresa.com',
    });

    renderProfileModal();

    fireEvent.click(screen.getByRole('button', { name: /excluir conta/i }));

    expect(screen.getByText(/esta ação não pode ser desfeita/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^excluir$/i })).toBeInTheDocument();
  });

  it('Deslogar-se limpa sessão, navega para /login e fecha o modal', () => {
    const { onClose } = renderProfileModal();

    fireEvent.click(screen.getByRole('button', { name: /deslogar-se/i }));

    expect(authService.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(onClose).toHaveBeenCalled();
  });

  it('X, Esc e clique no fundo chamam onClose no modo Perfil', () => {
    const { onClose } = renderProfileModal();

    // X
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    // Esc
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    // Fundo (backdrop)
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement!;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

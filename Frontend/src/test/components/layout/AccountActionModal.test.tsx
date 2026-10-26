import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, type InternalAxiosRequestConfig, type AxiosResponseHeaders } from 'axios';
import { MemoryRouter } from 'react-router-dom';
import AccountActionModal from '../../../components/layout/AccountActionModal';
import { authService } from '../../../services/authService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockToast = {
  show: vi.fn(),
  showError: vi.fn(),
};
vi.mock('../../../components/common/Toast', () => ({
  useToast: () => mockToast,
}));

vi.mock('../../../services/authService', () => ({
  authService: {
    atualizarConta: vi.fn(),
    excluirConta: vi.fn(),
  },
}));

function renderModal(
  mode: 'email' | 'senha' | 'excluir',
  onDone = vi.fn(),
  onCancel = vi.fn()
) {
  return {
    onDone,
    onCancel,
    ...render(
      <MemoryRouter>
        <AccountActionModal mode={mode} onDone={onDone} onCancel={onCancel} />
      </MemoryRouter>
    ),
  };
}

function criarErroAxios(status: number) {
  const err = new AxiosError('Erro de teste');
  err.response = {
    status,
    statusText: 'Error',
    headers: {} as AxiosResponseHeaders,
    config: {} as InternalAxiosRequestConfig,
    data: {},
  };
  return err;
}

describe('AccountActionModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mode: email', () => {
    it('mantém Salvar desabilitado enquanto campos estiverem vazios e habilita quando preenchidos', () => {
      renderModal('email');

      const saveBtn = screen.getByRole('button', { name: /salvar/i });
      expect(saveBtn).toBeDisabled();

      const emailInput = screen.getByLabelText(/novo e-mail/i);
      const passwordInput = screen.getByLabelText(/senha atual/i);

      fireEvent.change(emailInput, { target: { value: 'novo@empresa.com' } });
      expect(saveBtn).toBeDisabled();

      fireEvent.change(passwordInput, { target: { value: 'senha123' } });
      expect(saveBtn).toBeEnabled();
    });

    it('submete com sucesso, chama atualizarConta, exibe toast e chama onDone', async () => {
      vi.mocked(authService.atualizarConta).mockResolvedValue(undefined);
      const { onDone } = renderModal('email');

      fireEvent.change(screen.getByLabelText(/novo e-mail/i), {
        target: { value: '  Novo@Empresa.COM  ' },
      });
      fireEvent.change(screen.getByLabelText(/senha atual/i), {
        target: { value: 'senha123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

      await waitFor(() => {
        expect(authService.atualizarConta).toHaveBeenCalledWith({
          senhaAtual: 'senha123',
          email: 'novo@empresa.com',
        });
        expect(mockToast.show).toHaveBeenCalledWith('E-mail alterado');
        expect(onDone).toHaveBeenCalledWith('novo@empresa.com');
      });
    });

    it('exibe erro 403 em role=alert mantendo campos preenchidos', async () => {
      vi.mocked(authService.atualizarConta).mockRejectedValue(criarErroAxios(403));
      renderModal('email');

      const emailInput = screen.getByLabelText(/novo e-mail/i);
      const passwordInput = screen.getByLabelText(/senha atual/i);

      fireEvent.change(emailInput, { target: { value: 'novo@empresa.com' } });
      fireEvent.change(passwordInput, { target: { value: 'senhaErrada' } });

      fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/senha atual incorreta/i);
      });

      expect(emailInput).toHaveValue('novo@empresa.com');
      expect(passwordInput).toHaveValue('senhaErrada');
    });

    it('exibe erro 409 (e-mail em uso) em role=alert', async () => {
      vi.mocked(authService.atualizarConta).mockRejectedValue(criarErroAxios(409));
      renderModal('email');

      fireEvent.change(screen.getByLabelText(/novo e-mail/i), {
        target: { value: 'ja_existe@empresa.com' },
      });
      fireEvent.change(screen.getByLabelText(/senha atual/i), {
        target: { value: 'senha123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/e-mail já em uso/i);
      });
    });
  });

  describe('mode: senha', () => {
    it('desabilita Salvar com menos de 8 caracteres e habilita com 8+', () => {
      renderModal('senha');

      const saveBtn = screen.getByRole('button', { name: /salvar/i });
      const newPasswordInput = screen.getByLabelText(/nova senha/i);
      const passwordInput = screen.getByLabelText(/senha atual/i);

      fireEvent.change(passwordInput, { target: { value: 'senha123' } });
      fireEvent.change(newPasswordInput, { target: { value: '1234567' } });
      expect(saveBtn).toBeDisabled();

      fireEvent.change(newPasswordInput, { target: { value: '12345678' } });
      expect(saveBtn).toBeEnabled();
    });

    it('submete com sucesso, chama atualizarConta, exibe toast e chama onDone', async () => {
      vi.mocked(authService.atualizarConta).mockResolvedValue(undefined);
      const { onDone } = renderModal('senha');

      fireEvent.change(screen.getByLabelText(/nova senha/i), {
        target: { value: 'novaSenha123' },
      });
      fireEvent.change(screen.getByLabelText(/senha atual/i), {
        target: { value: 'senhaAtual123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

      await waitFor(() => {
        expect(authService.atualizarConta).toHaveBeenCalledWith({
          senhaAtual: 'senhaAtual123',
          novaSenha: 'novaSenha123',
        });
        expect(mockToast.show).toHaveBeenCalledWith('Senha alterada');
        expect(onDone).toHaveBeenCalled();
      });
    });
  });

  describe('mode: excluir', () => {
    it('mostra aviso de exclusão e botão Excluir desabilitado até digitar senha', () => {
      renderModal('excluir');

      expect(
        screen.getByText(/esta ação não pode ser desfeita/i)
      ).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /excluir/i });
      expect(deleteBtn).toBeDisabled();

      fireEvent.change(screen.getByLabelText(/senha atual/i), {
        target: { value: 'minhaSenha' },
      });
      expect(deleteBtn).toBeEnabled();
    });

    it('exclui com sucesso, chama excluirConta e navega para /login', async () => {
      vi.mocked(authService.excluirConta).mockResolvedValue(undefined);
      renderModal('excluir');

      fireEvent.change(screen.getByLabelText(/senha atual/i), {
        target: { value: 'minhaSenha' },
      });

      fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

      await waitFor(() => {
        expect(authService.excluirConta).toHaveBeenCalledWith('minhaSenha');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('exibe erro 409 (único admin) em role=alert', async () => {
      vi.mocked(authService.excluirConta).mockRejectedValue(criarErroAxios(409));
      renderModal('excluir');

      fireEvent.change(screen.getByLabelText(/senha atual/i), {
        target: { value: 'minhaSenha' },
      });

      fireEvent.click(screen.getByRole('button', { name: /excluir/i }));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/único administrador da empresa/i);
      });
    });
  });

  describe('comportamentos comuns', () => {
    it('erro genérico exibe toast de erro mantendo campos', async () => {
      vi.mocked(authService.atualizarConta).mockRejectedValue(new Error('Falha de rede'));
      renderModal('email');

      const emailInput = screen.getByLabelText(/novo e-mail/i);
      const passwordInput = screen.getByLabelText(/senha atual/i);

      fireEvent.change(emailInput, { target: { value: 'novo@empresa.com' } });
      fireEvent.change(passwordInput, { target: { value: 'senha123' } });

      fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

      await waitFor(() => {
        expect(mockToast.showError).toHaveBeenCalledWith(
          expect.stringMatching(/não foi possível concluir/i)
        );
      });

      expect(emailInput).toHaveValue('novo@empresa.com');
      expect(passwordInput).toHaveValue('senha123');
    });

    it('desabilita botões enquanto saving está ativo e impede envio duplo', async () => {
      let resolvePromise: () => void = () => {};
      const pendingPromise = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(authService.atualizarConta).mockReturnValue(pendingPromise);

      renderModal('email');

      fireEvent.change(screen.getByLabelText(/novo e-mail/i), {
        target: { value: 'novo@empresa.com' },
      });
      fireEvent.change(screen.getByLabelText(/senha atual/i), {
        target: { value: 'senha123' },
      });

      const saveBtn = screen.getByRole('button', { name: /salvar/i });
      const cancelBtn = screen.getByRole('button', { name: /cancelar/i });

      fireEvent.click(saveBtn);
      expect(saveBtn).toBeDisabled();
      expect(cancelBtn).toBeDisabled();

      // Tentativa de segundo clique
      fireEvent.click(saveBtn);
      expect(authService.atualizarConta).toHaveBeenCalledTimes(1);

      resolvePromise();
      await waitFor(() => {
        expect(saveBtn).not.toBeDisabled();
      });
    });

    it('clicar em Cancelar chama onCancel sem chamar o serviço', () => {
      const { onCancel } = renderModal('email');

      fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(onCancel).toHaveBeenCalled();
      expect(authService.atualizarConta).not.toHaveBeenCalled();
    });

    it('pressionar Esc chama onCancel sem chamar o serviço', () => {
      const { onCancel } = renderModal('email');

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onCancel).toHaveBeenCalled();
      expect(authService.atualizarConta).not.toHaveBeenCalled();
    });
  });
});

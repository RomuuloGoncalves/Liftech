import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import InitialPasswordModal from '../../../components/accessRequests/InitialPasswordModal';
import { ToastProvider } from '../../../components/common/Toast';

describe('InitialPasswordModal', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders email, initial password, password warning and copy buttons', () => {
    const onClose = vi.fn();

    render(
      <ToastProvider>
        <InitialPasswordModal
          email="admin@empresa.com"
          senha="initialPassword12"
          onClose={onClose}
        />
      </ToastProvider>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('admin@empresa.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('initialPassword12')).toBeInTheDocument();
    expect(screen.getByText(/Copie e guarde esta senha em local seguro/i)).toBeInTheDocument();
  });

  it('calls navigator.clipboard.writeText with password and shows copied toast when copy button is clicked', async () => {
    const onClose = vi.fn();

    render(
      <ToastProvider>
        <InitialPasswordModal
          email="admin@empresa.com"
          senha="initialPassword12"
          onClose={onClose}
        />
      </ToastProvider>
    );

    const copyButtons = screen.getAllByRole('button', { name: /copiar/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('initialPassword12');
    expect(await screen.findByText(/Senha copiada!/i)).toBeInTheDocument();
  });

  it('does not show the copied toast when the clipboard write fails', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error('denied'));

    render(
      <ToastProvider>
        <InitialPasswordModal email="admin@empresa.com" senha="initialPassword12" onClose={vi.fn()} />
      </ToastProvider>
    );

    fireEvent.click(screen.getAllByRole('button', { name: /copiar/i })[0]);

    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    expect(screen.queryByText(/Senha copiada!/i)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked or Escape is pressed', () => {
    const onClose = vi.fn();

    render(
      <ToastProvider>
        <InitialPasswordModal
          email="admin@empresa.com"
          senha="initialPassword12"
          onClose={onClose}
        />
      </ToastProvider>
    );

    const closeButtons = screen.getAllByRole('button', { name: 'Fechar' });
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RejectDialog from '../../../components/accessRequests/RejectDialog';

describe('RejectDialog', () => {
  it('renders modal with title, label and textarea with maxLength 200', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <RejectDialog
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const textarea = screen.getByLabelText(/Motivo da recusa/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('maxLength', '200');
  });

  it('calls onConfirm with empty string when Recusar is clicked without text', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <RejectDialog
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Recusar/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onConfirm with typed text when Recusar is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <RejectDialog
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const textarea = screen.getByLabelText(/Motivo da recusa/i);
    fireEvent.change(textarea, { target: { value: 'Empresa não atende aos requisitos' } });

    fireEvent.click(screen.getByRole('button', { name: /Recusar/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith('Empresa não atende aos requisitos');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel and never onConfirm when Cancelar is clicked', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <RejectDialog
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onCancel on Escape, never onConfirm', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <RejectDialog
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

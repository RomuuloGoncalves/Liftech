import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AccessRequestCard from '../../../components/accessRequests/AccessRequestCard';
import type { AccessRequest } from '../../../services/accessRequestService';

const mockRequest: AccessRequest = {
  _id: 'req-1',
  email: 'diretoria@acme.com',
  nomeEmpresa: 'Acme Soluções',
  nomeAdministrador: 'Carlos Silva',
  status: 'pendente',
  createdAt: '2026-10-23T10:00:00.000Z',
  updatedAt: '2026-10-23T10:00:00.000Z',
};

describe('AccessRequestCard', () => {
  it('renders empresa, email, admin and formatted date (ACCR-02 AC4)', () => {
    render(<AccessRequestCard request={mockRequest} />);

    expect(screen.getByText('Acme Soluções')).toBeInTheDocument();
    expect(screen.getByText('diretoria@acme.com')).toBeInTheDocument();
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    expect(screen.getByText(/23 outubro 2026/i)).toBeInTheDocument();
  });

  it('renders accept and reject buttons when handlers are passed and calls them on click', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <AccessRequestCard
        request={mockRequest}
        onAccept={onAccept}
        onReject={onReject}
      />
    );

    const acceptBtn = screen.getByRole('button', { name: /aceitar/i });
    const rejectBtn = screen.getByRole('button', { name: /recusar/i });

    expect(acceptBtn).toBeInTheDocument();
    expect(rejectBtn).toBeInTheDocument();

    fireEvent.click(acceptBtn);
    expect(onAccept).toHaveBeenCalledTimes(1);

    fireEvent.click(rejectBtn);
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('does not render buttons when onAccept and onReject are omitted', () => {
    render(<AccessRequestCard request={mockRequest} />);

    expect(screen.queryByRole('button', { name: /aceitar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /recusar/i })).not.toBeInTheDocument();
  });

  it('renders motivoRecusa when present and does not render it when absent (ACCR-07 AC7)', () => {
    const { rerender } = render(<AccessRequestCard request={mockRequest} />);
    expect(screen.queryByText(/Motivo/i)).not.toBeInTheDocument();

    const rejectedRequest: AccessRequest = {
      ...mockRequest,
      status: 'recusada',
      motivoRecusa: 'Falta de documentação comprobatória',
    };

    rerender(<AccessRequestCard request={rejectedRequest} />);
    expect(screen.getByText(/Motivo/i)).toBeInTheDocument();
    expect(screen.getByText('Falta de documentação comprobatória')).toBeInTheDocument();
  });

  it('disables buttons when busy is true', () => {
    const onAccept = vi.fn();
    const onReject = vi.fn();

    render(
      <AccessRequestCard
        request={mockRequest}
        onAccept={onAccept}
        onReject={onReject}
        busy={true}
      />
    );

    expect(screen.getByRole('button', { name: /aceitar/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /recusar/i })).toBeDisabled();
  });
});

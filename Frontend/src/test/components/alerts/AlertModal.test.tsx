import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AlertModal from '../../../components/alerts/AlertModal';
import type { Incidente } from '../../../services/incidentService';
import i18n from '../../../config/i18n';

const incidentBase: Incidente = {
  _id: 'i1',
  machineId: 'm1',
  maquina: { nome: 'Titan', identificacao: 'EMP-084(ID)', setor: 'Expedição - Bloco B' },
  operador: { nome: 'Alexandre Mattos' },
  dataIncidente: '2026-10-15T12:00:00.000Z',
  forcaImpacto: null,
  status: 'pendente',
  origem: 'funcionario',
  descricao: null,
};

describe('AlertModal', () => {
  it('renders complete text with sector and employee inside <b> and machine outside', () => {
    const { container } = render(<AlertModal incident={incidentBase} onClose={vi.fn()} />);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(
      'Acidente no setor Expedição - Bloco B, Alexandre Mattos funcionário responsável pela máquina EMP-084(ID).'
    );

    const bTags = container.querySelectorAll('b');
    expect(bTags).toHaveLength(2);
    expect(bTags[0]).toHaveTextContent('Expedição - Bloco B');
    expect(bTags[1]).toHaveTextContent('Alexandre Mattos');
    for (const b of bTags) {
      expect(b).not.toHaveTextContent('EMP-084(ID)');
    }
  });

  it('renders "não informado" for sector and machine when maquina is null', () => {
    render(<AlertModal incident={{ ...incidentBase, maquina: null }} onClose={vi.fn()} />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Acidente no setor não informado, Alexandre Mattos funcionário responsável pela máquina não informado.'
    );
  });

  it('renders "não informado" for employee when operador is null', () => {
    render(<AlertModal incident={{ ...incidentBase, operador: null }} onClose={vi.fn()} />);

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Acidente no setor Expedição - Bloco B, não informado funcionário responsável pela máquina EMP-084(ID).'
    );
  });

  it('renders "não informado" for sector when maquina.setor is empty string', () => {
    render(
      <AlertModal
        incident={{ ...incidentBase, maquina: { ...incidentBase.maquina!, setor: '' } }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Acidente no setor não informado, Alexandre Mattos funcionário responsável pela máquina EMP-084(ID).'
    );
  });

  it('has alertdialog role with accessible name "Alerta!" and description matching text', () => {
    render(<AlertModal incident={incidentBase} onClose={vi.fn()} />);

    const dialog = screen.getByRole('alertdialog', { name: 'Alerta!' });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(
      'Acidente no setor Expedição - Bloco B, Alexandre Mattos funcionário responsável pela máquina EMP-084(ID).'
    );
  });

  it('moves focus to the Ok button on initial render', () => {
    render(<AlertModal incident={incidentBase} onClose={vi.fn()} />);

    const okButton = screen.getByRole('button', { name: 'Ok' });
    expect(okButton).toHaveFocus();
  });

  it('moves focus to the Ok button when rerendered with another incident', () => {
    const { rerender } = render(<AlertModal incident={incidentBase} onClose={vi.fn()} />);
    const okButton = screen.getByRole('button', { name: 'Ok' });
    expect(okButton).toHaveFocus();

    okButton.blur();
    expect(okButton).not.toHaveFocus();

    rerender(<AlertModal incident={{ ...incidentBase, _id: 'i2' }} onClose={vi.fn()} />);
    expect(okButton).toHaveFocus();
  });

  it('calls onClose once on Ok button click and once on Escape key press', () => {
    const onCloseOk = vi.fn();
    const { unmount } = render(<AlertModal incident={incidentBase} onClose={onCloseOk} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
    expect(onCloseOk).toHaveBeenCalledTimes(1);
    unmount();

    const onCloseEsc = vi.fn();
    render(<AlertModal incident={incidentBase} onClose={onCloseEsc} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCloseEsc).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking on the backdrop', () => {
    const onClose = vi.fn();
    render(<AlertModal incident={incidentBase} onClose={onClose} />);

    const dialog = screen.getByRole('alertdialog');
    const backdrop = dialog.parentElement as HTMLElement;
    fireEvent.click(backdrop);

    expect(onClose).not.toHaveBeenCalled();
  });

  describe('offline variant (TLQ-07)', () => {
    afterEach(async () => {
      await act(async () => {
        await i18n.changeLanguage('pt-BR');
      });
    });

    it('renders machine identification in bold and offline message', async () => {
      let containerResult: HTMLElement | undefined;
      await act(async () => {
        const { container } = render(
          <AlertModal
            variant="offline"
            offline={{ machineId: 'm1', identificacao: 'EMP-084(ID)', filialId: 'f1' }}
            onClose={vi.fn()}
          />
        );
        containerResult = container;
      });

      const dialog = screen.getByRole('alertdialog', { name: 'Placa sem comunicação' });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveTextContent(
        'A máquina EMP-084(ID) está sem comunicação com o sistema.'
      );

      const bTags = containerResult!.querySelectorAll('b');
      expect(bTags).toHaveLength(1);
      expect(bTags[0]).toHaveTextContent('EMP-084(ID)');
    });

    it('falls back to "não informado" when identificacao is empty', async () => {
      await act(async () => {
        render(
          <AlertModal
            variant="offline"
            offline={{ machineId: 'm1', identificacao: '', filialId: 'f1' }}
            onClose={vi.fn()}
          />
        );
      });

      expect(screen.getByRole('alertdialog')).toHaveTextContent(
        'A máquina não informado está sem comunicação com o sistema.'
      );
    });

    it('focuses Ok button and calls onClose on click or Escape', async () => {
      const onClose = vi.fn();
      await act(async () => {
        render(
          <AlertModal
            variant="offline"
            identificacao="EMP-084"
            onClose={onClose}
          />
        );
      });

      const okButton = screen.getByRole('button', { name: 'Ok' });
      expect(okButton).toHaveFocus();

      await act(async () => {
        fireEvent.click(okButton);
      });
      expect(onClose).toHaveBeenCalledTimes(1);

      await act(async () => {
        fireEvent.keyDown(window, { key: 'Escape' });
      });
      expect(onClose).toHaveBeenCalledTimes(2);
    });

    const languages = [
      { code: 'pt-BR', title: 'Placa sem comunicação' },
      { code: 'en-US', title: 'Device offline' },
      { code: 'es', title: 'Placa sin comunicación' },
      { code: 'fr', title: 'Carte hors ligne' },
      { code: 'de', title: 'Platine ohne Verbindung' },
      { code: 'ja', title: '基板通信途絶' },
      { code: 'ru', title: 'Плата не на связи' },
    ];

    it.each(languages)(
      'renders offline variant showing machine identification in $code',
      async ({ code, title }) => {
        await act(async () => {
          await i18n.changeLanguage(code);
        });

        let unmountFn: () => void = () => {};
        await act(async () => {
          const { unmount } = render(
            <AlertModal
              variant="offline"
              offline={{ machineId: 'm1', identificacao: 'EMP-999' }}
              onClose={vi.fn()}
            />
          );
          unmountFn = unmount;
        });

        const dialog = screen.getByRole('alertdialog', { name: title });
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveTextContent('EMP-999');

        await act(async () => {
          unmountFn();
        });
      }
    );
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../config/i18n';
import type { Machine } from '../../../data/machines';
import MachineTable from '../../../components/dashboard/MachineTable';

beforeEach(async () => {
  await i18n.changeLanguage('pt-BR');
});

function makeMachine(num: number, overrides: Partial<Machine> = {}): Machine {
  return {
    id: `m-${num}`,
    identificacao: `EMP-0${num}`,
    nome: `Empilhadeira ${num}`,
    setor: 'Expedição - Bloco B',
    setorId: 's1',
    status: 'disponivel',
    categoriaId: null,
    categoriaTravada: false,
    dispositivoConectado: { enderecoMac: 'AA:BB:CC' },
    tempoSessaoMinutos: 34,
    ...overrides,
  };
}

describe('MachineTable', () => {
  it('paginates 23 machines into 3 pages, disables prev on page 1, enables next, and on page 3 shows 3 rows with next disabled', () => {
    const machines = Array.from({ length: 23 }, (_, i) => makeMachine(i + 1));
    const onOpen = vi.fn();
    const onCreate = vi.fn();

    render(<MachineTable machines={machines} onOpen={onOpen} onCreate={onCreate} />);

    // Page 1: 10 rows
    expect(screen.getByText('Exibindo 23 máquinas - Página 1 de 3')).toBeInTheDocument();
    const prevButton = screen.getByRole('button', { name: 'Página anterior' });
    const nextButton = screen.getByRole('button', { name: 'Próxima página' });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Navigate to page 2
    fireEvent.click(nextButton);
    expect(screen.getByText('Exibindo 23 máquinas - Página 2 de 3')).toBeInTheDocument();
    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeEnabled();

    // Navigate to page 3
    fireEvent.click(nextButton);
    expect(screen.getByText('Exibindo 23 máquinas - Página 3 de 3')).toBeInTheDocument();
    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeDisabled();

    // On page 3, exactly 3 machine rows (21, 22, 23)
    expect(screen.getByText('Empilhadeira 21')).toBeInTheDocument();
    expect(screen.getByText('Empilhadeira 22')).toBeInTheDocument();
    expect(screen.getByText('Empilhadeira 23')).toBeInTheDocument();
    expect(screen.queryByText('Empilhadeira 20')).not.toBeInTheDocument();
  });

  it('calculates 20 machines as 2 pages', () => {
    const machines = Array.from({ length: 20 }, (_, i) => makeMachine(i + 1));
    render(<MachineTable machines={machines} onOpen={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByText('Exibindo 20 máquinas - Página 1 de 2')).toBeInTheDocument();
  });

  it('filters by name and identification and resets to page 1', () => {
    const machines = Array.from({ length: 25 }, (_, i) =>
      makeMachine(i + 1, {
        nome: i === 24 ? 'Titan Special' : `Empilhadeira ${i + 1}`,
        identificacao: i === 23 ? 'CUSTOM-999' : `EMP-${i + 1}`,
      })
    );

    render(<MachineTable machines={machines} onOpen={vi.fn()} onCreate={vi.fn()} />);

    const nextButton = screen.getByRole('button', { name: 'Próxima página' });
    fireEvent.click(nextButton);
    expect(screen.getByText('Exibindo 25 máquinas - Página 2 de 3')).toBeInTheDocument();

    const searchInput = screen.getByRole('searchbox', { name: 'Buscar máquinas' });

    // Filter by name
    fireEvent.change(searchInput, { target: { value: 'Titan' } });
    expect(screen.getByText('Exibindo 1 máquina - Página 1 de 1')).toBeInTheDocument();
    expect(screen.getByText('Titan Special')).toBeInTheDocument();

    // Filter by identification
    fireEvent.change(searchInput, { target: { value: 'CUSTOM-999' } });
    expect(screen.getByText('Exibindo 1 máquina - Página 1 de 1')).toBeInTheDocument();
    expect(screen.getByText('Empilhadeira 24')).toBeInTheDocument();
  });

  it('shows empty message, 0 machines count, and disables both arrows when search has no results', () => {
    const machines = [makeMachine(1)];

    render(<MachineTable machines={machines} onOpen={vi.fn()} onCreate={vi.fn()} />);

    const searchInput = screen.getByRole('searchbox', { name: 'Buscar máquinas' });
    fireEvent.change(searchInput, { target: { value: 'inexistente' } });

    expect(screen.getByText('Nenhuma máquina encontrada')).toBeInTheDocument();
    expect(screen.getByText('Exibindo 0 máquinas - Página 1 de 1')).toBeInTheDocument();

    const prevButton = screen.getByRole('button', { name: 'Página anterior' });
    const nextButton = screen.getByRole('button', { name: 'Próxima página' });
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it('calls onOpen when machine name is clicked', () => {
    const m = makeMachine(1, { nome: 'Titan-X' });
    const onOpen = vi.fn();

    render(<MachineTable machines={[m]} onOpen={onOpen} onCreate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Titan-X' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith(m);
  });

  it('calls onCreate when Cadastrar Máquina is clicked', () => {
    const onCreate = vi.fn();

    render(<MachineTable machines={[]} onOpen={vi.fn()} onCreate={onCreate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Máquina' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('formats column Tempo as "34 minutos"', () => {
    const m = makeMachine(1, { tempoSessaoMinutos: 34 });
    render(<MachineTable machines={[m]} onOpen={vi.fn()} onCreate={vi.fn()} />);

    expect(screen.getByText('34 minutos')).toBeInTheDocument();
  });
});

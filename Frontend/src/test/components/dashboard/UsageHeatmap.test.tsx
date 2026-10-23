import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '../../../config/i18n';
import UsageHeatmap from '../../../components/dashboard/UsageHeatmap';
import styles from '../../../components/dashboard/UsageHeatmap.module.css';

beforeEach(async () => {
  await i18n.changeLanguage('pt-BR');
});

describe('UsageHeatmap', () => {
  const emptyGrid = Array.from({ length: 7 }, () => Array(7).fill(0));

  it('renders day headers (Seg...Dom) and hour headers (6...18 hrs) in Figma order', () => {
    render(<UsageHeatmap counts={emptyGrid} />);

    const expectedDays = ['Seg', 'Ter', 'Quar', 'Quin', 'Sex', 'Sab', 'Dom'];
    const expectedHours = ['6 hrs', '8 hrs', '10 hrs', '12 hrs', '15 hrs', '16 hrs', '18 hrs'];

    const columnHeaders = screen.getAllByRole('columnheader').map((el) => el.textContent?.trim()).filter(Boolean);
    expect(columnHeaders).toEqual(expectedDays);

    const rowHeaders = screen.getAllByRole('rowheader').map((el) => el.textContent?.trim());
    expect(rowHeaders).toEqual(expectedHours);
  });

  it('renders cell with aria-label and strong level class when it is the maximum, and light class for zero', () => {
    const grid = Array.from({ length: 7 }, () => Array(7).fill(0));
    // Row 0 (6 hrs), Col 0 (Seg) = 3 sessions (max)
    grid[0]![0] = 3;

    render(<UsageHeatmap counts={grid} />);

    const maxCell = screen.getByLabelText('Seg, 6 hrs: 3 sessões');
    expect(maxCell).toBeInTheDocument();
    expect(maxCell).toHaveClass(styles.level2);

    const zeroCell = screen.getByLabelText('Ter, 6 hrs: 0 sessões');
    expect(zeroCell).toBeInTheDocument();
    expect(zeroCell).toHaveClass(styles.level0);
  });

  it('shows "Sem registros no período" when grid is all zeros, and hides it when counts exist', () => {
    const { rerender } = render(<UsageHeatmap counts={emptyGrid} />);
    expect(screen.getByText('Sem registros no período')).toBeInTheDocument();

    const withSession = Array.from({ length: 7 }, () => Array(7).fill(0));
    withSession[1]![1] = 1;

    rerender(<UsageHeatmap counts={withSession} />);
    expect(screen.queryByText('Sem registros no período')).not.toBeInTheDocument();
  });

  it('renders "Menos" and "Mais" in the legend', () => {
    render(<UsageHeatmap counts={emptyGrid} />);
    expect(screen.getByText('Menos')).toBeInTheDocument();
    expect(screen.getByText('Mais')).toBeInTheDocument();
    expect(screen.getByText('Sessões nas últimas 4 semanas')).toBeInTheDocument();
  });
});

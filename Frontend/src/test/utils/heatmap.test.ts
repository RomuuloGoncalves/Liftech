import { describe, it, expect } from 'vitest';
import { countSessions, heatmapLevel, heatmapFrom, HEATMAP_HOURS, HEATMAP_WEEKS } from '../../utils/heatmap';

describe('heatmap utils', () => {
  describe('constants', () => {
    it('defines HEATMAP_HOURS and HEATMAP_WEEKS', () => {
      expect(HEATMAP_HOURS).toEqual([6, 8, 10, 12, 15, 16, 18]);
      expect(HEATMAP_WEEKS).toBe(4);
    });
  });

  describe('countSessions', () => {
    it('returns a 7x7 grid of zeros for an empty list', () => {
      const grid = countSessions([]);
      expect(grid).toHaveLength(7);
      grid.forEach((row) => {
        expect(row).toHaveLength(7);
        expect(row.every((val) => val === 0)).toBe(true);
      });
    });

    it('ignores sessions before 06:00 (e.g. 05:59)', () => {
      // Monday 2026-10-26 at 05:59 local
      const d = new Date(2026, 9, 26, 5, 59);
      const grid = countSessions([d.toISOString()]);
      const total = grid.flat().reduce((a, b) => a + b, 0);
      expect(total).toBe(0);
    });

    it('maps 06:00 on Monday to row 0, column 0', () => {
      const d = new Date(2026, 9, 26, 6, 0);
      const grid = countSessions([d.toISOString()]);
      expect(grid[0][0]).toBe(1);
    });

    it('maps 14:59 to row 3 (faixa 12)', () => {
      const d = new Date(2026, 9, 26, 14, 59);
      const grid = countSessions([d.toISOString()]);
      expect(grid[3][0]).toBe(1);
    });

    it('maps 15:00 to row 4', () => {
      const d = new Date(2026, 9, 26, 15, 0);
      const grid = countSessions([d.toISOString()]);
      expect(grid[4][0]).toBe(1);
    });

    it('maps 23:59 to row 6 (faixa 18)', () => {
      const d = new Date(2026, 9, 26, 23, 59);
      const grid = countSessions([d.toISOString()]);
      expect(grid[6][0]).toBe(1);
    });

    it('maps Sunday to column 6', () => {
      // Sunday 2026-10-25 at 08:30
      const d = new Date(2026, 9, 25, 8, 30);
      const grid = countSessions([d.toISOString()]);
      expect(grid[1][6]).toBe(1);
    });
  });

  describe('heatmapLevel', () => {
    it('calculates levels correctly: 0 claro, 1 médio, 2 forte', () => {
      expect(heatmapLevel(0, 4)).toBe(0);
      expect(heatmapLevel(1, 4)).toBe(1);
      expect(heatmapLevel(2, 4)).toBe(1);
      expect(heatmapLevel(3, 4)).toBe(2);
      expect(heatmapLevel(1, 1)).toBe(2);
    });
  });

  describe('heatmapFrom', () => {
    it('returns today - 27 days in YYYY-MM-DD format (local date)', () => {
      // 2026-10-28 is month 9
      const today = new Date(2026, 9, 28);
      expect(heatmapFrom(today)).toBe('2026-10-01');
    });
  });
});

export const HEATMAP_HOURS = [6, 8, 10, 12, 15, 16, 18];
export const HEATMAP_WEEKS = 4;

function getHourRow(hour: number): number {
  if (hour < HEATMAP_HOURS[0]) return -1;
  let row = -1;
  for (let i = 0; i < HEATMAP_HOURS.length; i++) {
    if (hour >= HEATMAP_HOURS[i]) {
      row = i;
    } else {
      break;
    }
  }
  return row;
}

// grade[linha da faixa][coluna], coluna 0 = Seg ... 6 = Dom
export function countSessions(inicios: string[]): number[][] {
  const grid: number[][] = Array.from({ length: HEATMAP_HOURS.length }, () => Array(7).fill(0));
  for (const inicio of inicios) {
    const date = new Date(inicio);
    if (Number.isNaN(date.getTime())) continue;
    const hour = date.getHours();
    const row = getHourRow(hour);
    if (row === -1) continue;
    const col = (date.getDay() + 6) % 7;
    grid[row][col] += 1;
  }
  return grid;
}

// 0 claro, 1 médio, 2 forte
export function heatmapLevel(count: number, max: number): 0 | 1 | 2 {
  if (count <= 0) return 0;
  if (count * 2 > max) return 2;
  return 1;
}

// 'YYYY-MM-DD' de today − 27 dias, data local
export function heatmapFrom(today: Date): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 27);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { heatmapLevel, HEATMAP_HOURS } from '../../utils/heatmap';
import styles from './UsageHeatmap.module.css';

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const LEVEL_CLASSES = [styles.level0, styles.level1, styles.level2];

export interface UsageHeatmapProps {
  counts: number[][];
}

export function UsageHeatmap({ counts }: UsageHeatmapProps): React.JSX.Element {
  const { t } = useTranslation();

  const safeCounts =
    Array.isArray(counts) && counts.length === HEATMAP_HOURS.length
      ? counts
      : Array.from({ length: HEATMAP_HOURS.length }, () => Array(7).fill(0));

  const flatCounts = safeCounts.flat();
  const max = Math.max(0, ...flatCounts);
  const total = flatCounts.reduce((acc, val) => acc + val, 0);

  return (
    <section className={styles.container} aria-label={t('dashboard.usageTitle')}>
      <div className={styles.header}>
        <Clock className={styles.icon} size={20} aria-hidden="true" />
        <h2 className={styles.title}>{t('dashboard.usageTitle')}</h2>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" aria-hidden="true" />
              {DAYS.map((dayKey) => (
                <th key={dayKey} scope="col" className={styles.dayHeader}>
                  {t(`dashboard.weekdays.${dayKey}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HEATMAP_HOURS.map((hour, rowIndex) => (
              <tr key={hour}>
                <th scope="row" className={styles.hourHeader}>
                  {t('dashboard.hourLabel', { hour })}
                </th>
                {DAYS.map((dayKey, colIndex) => {
                  const count = safeCounts[rowIndex]?.[colIndex] ?? 0;
                  const level = heatmapLevel(count, max);
                  const dayLabel = t(`dashboard.weekdays.${dayKey}`);
                  const cellLabel = t('dashboard.cellLabel', { day: dayLabel, hour, count });

                  return (
                    <td
                      key={dayKey}
                      className={`${styles.cell} ${LEVEL_CLASSES[level]}`}
                      aria-label={cellLabel}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <div className={styles.legend}>
          <span className={styles.legendText}>{t('dashboard.less')}</span>
          <span className={`${styles.legendBox} ${styles.level0}`} aria-hidden="true" />
          <span className={`${styles.legendBox} ${styles.level1}`} aria-hidden="true" />
          <span className={`${styles.legendBox} ${styles.level2}`} aria-hidden="true" />
          <span className={styles.legendText}>{t('dashboard.more')}</span>
        </div>
        <p className={styles.periodText}>{t('dashboard.period')}</p>
        {total === 0 && <p className={styles.noSessions}>{t('dashboard.noSessions')}</p>}
      </div>
    </section>
  );
}

export default UsageHeatmap;

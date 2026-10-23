import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Forklift, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Machine } from '../../data/machines';
import StatusBadge from '../machines/StatusBadge';
import styles from './MachineTable.module.css';

const PAGE_SIZE = 10;

export interface MachineTableProps {
  machines: Machine[];
  onOpen: (machine: Machine) => void;
  onCreate: () => void;
}

export function MachineTable({ machines, onOpen, onCreate }: MachineTableProps): React.JSX.Element {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = machines.filter(
    (m) =>
      (m.nome ?? '').toLowerCase().includes(normalizedQuery) ||
      (m.identificacao ?? '').toLowerCase().includes(normalizedQuery)
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(1);
  };

  return (
    <section className={styles.container} aria-label={t('dashboard.machineList')}>
      <div className={styles.topBar}>
        <div className={styles.titleArea}>
          <Forklift className={styles.icon} size={22} aria-hidden="true" />
          <h2 className={styles.title}>{t('dashboard.machineList')}</h2>
        </div>

        <div className={styles.actionsArea}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={16} aria-hidden="true" />
            <input
              type="search"
              className={styles.searchInput}
              placeholder={t('machines.searchPlaceholder')}
              aria-label={t('dashboard.searchLabel')}
              value={query}
              onChange={handleQueryChange}
            />
          </div>

          <button
            type="button"
            className={styles.createButton}
            onClick={onCreate}
          >
            <Plus size={16} aria-hidden="true" />
            <span>{t('machines.registerButton')}</span>
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.th}>{t('dashboard.colName')}</th>
              <th scope="col" className={styles.th}>{t('dashboard.colSector')}</th>
              <th scope="col" className={styles.th}>{t('dashboard.colTime')}</th>
              <th scope="col" className={styles.th}>{t('dashboard.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles.emptyCell}>
                  {t('dashboard.noResults')}
                </td>
              </tr>
            ) : (
              paginated.map((machine) => (
                <tr key={machine.id}>
                  <td className={styles.td}>
                    <button
                      type="button"
                      className={styles.nameButton}
                      onClick={() => onOpen(machine)}
                    >
                      {machine.nome}
                    </button>
                  </td>
                  <td className={styles.td}>{machine.setor || '-'}</td>
                  <td className={styles.td}>
                    {t('dashboard.minutes', { count: machine.tempoSessaoMinutos ?? 0 })}
                  </td>
                  <td className={styles.td}>
                    <StatusBadge status={machine.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <p className={styles.pageInfo}>
          {t('dashboard.pageInfo', {
            count: filtered.length,
            page: currentPage,
            pages: totalPages,
          })}
        </p>

        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label={t('dashboard.prevPage')}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>

          <span className={styles.pageNumber}>{currentPage}</span>

          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            aria-label={t('dashboard.nextPage')}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default MachineTable;

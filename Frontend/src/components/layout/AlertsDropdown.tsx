import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, ChevronRight, X } from 'lucide-react';
import type { Incidente } from '../../services/incidentService';
import styles from './AlertsDropdown.module.css';

export interface AlertsContextValue {
  recent: Incidente[];
  loading: boolean;
  error: boolean;
  hasUnseen: boolean;
  markSeen(): void;
  reload(): void;
  simulate?(): void;
}

export interface AlertsDropdownProps {
  alerts?: AlertsContextValue;
}

const DEFAULT_ALERTS: AlertsContextValue = {
  recent: [],
  loading: false,
  error: false,
  hasUnseen: false,
  markSeen: () => {},
  reload: () => {},
  simulate: () => {},
};

export function AlertsDropdown({ alerts = DEFAULT_ALERTS }: AlertsDropdownProps = {}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const toggle = () => {
    if (!open) {
      alerts.markSeen();
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const close = ({ restoreFocus = false }: { restoreFocus?: boolean } = {}) => {
    setOpen(false);
    if (restoreFocus) {
      bellRef.current?.focus();
    }
  };

  const go = () => {
    close({ restoreFocus: false });
    navigate('/alertas');
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close({ restoreFocus: true });
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
        close({ restoreFocus: false });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const bellLabel = t(
    alerts.hasUnseen ? 'alertsDropdown.bellUnseen' : 'alertsDropdown.bell'
  );

  return (
    <div className={styles.anchor} ref={anchorRef}>
      <button
        ref={bellRef}
        type="button"
        className={`${styles.bellButton} ${open ? styles.bellButtonActive : ''}`}
        aria-label={bellLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={toggle}
      >
        <Bell size={18} />
        {alerts.hasUnseen && <span className={styles.dot} aria-hidden="true" />}
      </button>

      {open && (
        <div
          className={styles.popover}
          role="dialog"
          aria-label={t('alertsDropdown.title')}
        >
          <div className={styles.header}>
            <button
              type="button"
              className={styles.titleButton}
              onClick={go}
            >
              <span>{t('alertsDropdown.title')}</span>
              <ChevronRight size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.closeButton}
              aria-label={t('alertsDropdown.close')}
              onClick={() => close({ restoreFocus: true })}
            >
              <X size={16} />
            </button>
          </div>

          {alerts.error ? (
            <div className={styles.messageBox}>
              <p className={styles.errorText}>{t('alertsDropdown.error')}</p>
              <button
                type="button"
                className={styles.retryButton}
                onClick={() => alerts.reload()}
              >
                {t('alertsDropdown.retry')}
              </button>
            </div>
          ) : alerts.loading && alerts.recent.length === 0 ? (
            <div className={styles.messageBox}>
              <p className={styles.loadingText}>{t('alertsDropdown.loading')}</p>
            </div>
          ) : alerts.recent.length === 0 ? (
            <div className={styles.messageBox}>
              <p className={styles.emptyText}>{t('alertsDropdown.empty')}</p>
            </div>
          ) : (
            <ul className={styles.list}>
              {alerts.recent.slice(0, 5).map((incidente) => {
                const machineName =
                  incidente.maquina?.nome || t('alertsDropdown.unknownMachine');
                return (
                  <li key={incidente._id}>
                    <button
                      type="button"
                      className={styles.rowButton}
                      onClick={go}
                    >
                      <span className={styles.machineName}>{machineName}</span>
                      <ChevronRight
                        size={12}
                        className={styles.rowChevron}
                        aria-hidden="true"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {!alerts.error && (
            <footer className={styles.footer}>
              <button
                type="button"
                className={styles.moreButton}
                onClick={go}
              >
                {t('alertsDropdown.more')}
              </button>
            </footer>
          )}
        </div>
      )}
    </div>
  );
}

export default AlertsDropdown;

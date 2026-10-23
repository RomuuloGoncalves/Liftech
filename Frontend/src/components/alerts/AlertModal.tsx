import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import type { Incidente } from '../../services/incidentService';
import styles from './AlertModal.module.css';

interface AlertModalProps {
  incident: Incidente;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ incident, onClose }) => {
  const { t } = useTranslation();
  const titleId = useId();
  const descId = useId();
  const okButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    okButtonRef.current?.focus();
  }, [incident]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const notInformed = t('alertModal.notInformed');
  const setor = incident.maquina?.setor?.trim() ? incident.maquina.setor : notInformed;
  const funcionario = incident.operador?.nome?.trim() ? incident.operador.nome : notInformed;
  const maquina = incident.maquina?.identificacao?.trim() ? incident.maquina.identificacao : notInformed;

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.card}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className={styles.iconCircle} aria-hidden="true">
          <AlertTriangle size={24} color="var(--white)" />
        </div>
        <h2 id={titleId} className={styles.title}>
          {t('alertModal.title')}
        </h2>
        <p id={descId} className={styles.message}>
          <Trans
            i18nKey="alertModal.message"
            values={{ setor, funcionario, maquina }}
            components={{ b: <b /> }}
          />
        </p>
        <button
          type="button"
          ref={okButtonRef}
          className={styles.okButton}
          onClick={onClose}
        >
          {t('alertModal.ok')}
        </button>
      </div>
    </div>
  );
};

export default AlertModal;

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AccessRequest } from '../../services/accessRequestService';
import { formatEventDate } from '../../utils/format';
import { InfoField } from '../common/InfoField';
import styles from './AccessRequestCard.module.css';

interface AccessRequestCardProps {
  request: AccessRequest;
  onAccept?: () => void;
  onReject?: () => void;
  busy?: boolean;
}

const AccessRequestCard: React.FC<AccessRequestCardProps> = ({ request, onAccept, onReject, busy }) => {
  const { t, i18n } = useTranslation();

  // Data local: o corte do ISO em UTC mostraria o dia seguinte à noite.
  const sent = request.createdAt ? new Date(request.createdAt) : null;
  const dateStr = sent && !Number.isNaN(sent.getTime())
    ? `${sent.getFullYear()}-${String(sent.getMonth() + 1).padStart(2, '0')}-${String(sent.getDate()).padStart(2, '0')}`
    : '';
  const formattedDate = dateStr ? formatEventDate(dateStr, i18n.language) : '';

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.company}>{request.nomeEmpresa}</h3>
      </div>

      <dl className={styles.details}>
        <InfoField
          label={`${t('accessRequests.email')}:`}
          inline
          title={request.email}
          valueClassName={styles.wrapValue}
        >
          {request.email}
        </InfoField>
        <InfoField
          label={`${t('accessRequests.admin')}:`}
          inline
          title={request.nomeAdministrador}
        >
          {request.nomeAdministrador}
        </InfoField>
        <InfoField
          label={`${t('accessRequests.sentAt')}:`}
          inline
          title={formattedDate}
        >
          {formattedDate}
        </InfoField>
        {request.motivoRecusa ? (
          <InfoField
            className={styles.reasonBox}
            label={`${t('accessRequests.reason')}:`}
            inline
            title={request.motivoRecusa}
            valueClassName={styles.wrapValue}
          >
            {request.motivoRecusa}
          </InfoField>
        ) : null}
      </dl>

      {(onAccept || onReject) && (
        <div className={styles.actions}>
          {onReject && (
            <button
              type="button"
              className={styles.rejectButton}
              onClick={onReject}
              disabled={busy}
            >
              {t('accessRequests.reject')}
            </button>
          )}
          {onAccept && (
            <button
              type="button"
              className={styles.acceptButton}
              onClick={onAccept}
              disabled={busy}
            >
              {t('accessRequests.accept')}
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default AccessRequestCard;

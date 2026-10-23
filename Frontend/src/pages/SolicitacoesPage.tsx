import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AccessRequestCard from '../components/accessRequests/AccessRequestCard';
import ConfirmDialog from '../components/common/ConfirmDialog';
import RejectDialog from '../components/accessRequests/RejectDialog';
import InitialPasswordModal from '../components/accessRequests/InitialPasswordModal';
import PageSkeleton from '../components/common/PageSkeleton';
import { useToast } from '../components/common/Toast';
import {
  accessRequestService,
  type AccessRequest,
  type AccessRequestStatus,
} from '../services/accessRequestService';
import styles from './SolicitacoesPage.module.css';

type LoadState = 'loading' | 'ready' | 'error';

type DialogState =
  | { kind: 'accept'; request: AccessRequest }
  | { kind: 'reject'; request: AccessRequest }
  | { kind: 'password'; email: string; senha: string }
  | null;

const TABS: AccessRequestStatus[] = ['pendente', 'aprovada', 'recusada'];

function extrairErro(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const res = (e as { response?: { data?: unknown } }).response;
    if (res?.data) {
      if (typeof res.data === 'string') return res.data;
      if (typeof res.data === 'object') {
        const d = res.data as Record<string, unknown>;
        if (typeof d.error === 'string') return d.error;
        if (typeof d.message === 'string') return d.message;
        if (typeof d.mensagem === 'string') return d.mensagem;
      }
    }
  }
  if (e instanceof Error) return e.message;
  return '';
}

function statusDoErro(e: unknown): number | undefined {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    return (e as { response?: { status?: number } }).response?.status;
  }
  return undefined;
}

const SolicitacoesPage: React.FC = () => {
  const { t } = useTranslation();
  const { show, showError } = useToast();

  const [tab, setTab] = useState<AccessRequestStatus>('pendente');
  const [loadedTab, setLoadedTab] = useState<AccessRequestStatus>(tab);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [attempt, setAttempt] = useState(0);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loadedTab !== tab) {
    setLoadedTab(tab);
    setLoadState('loading');
  }

  useEffect(() => {
    let stale = false;

    accessRequestService.listar(tab).then(
      (data) => {
        if (stale) return;
        setRequests(data);
        setLoadState('ready');
      },
      () => {
        if (!stale) setLoadState('error');
      }
    );

    return () => {
      stale = true;
    };
  }, [tab, attempt]);

  const retry = () => {
    setLoadState('loading');
    setAttempt((v) => v + 1);
  };

  const handleConfirmAccept = async () => {
    if (!dialog || dialog.kind !== 'accept' || busyId !== null) return;
    const { request } = dialog;
    setBusyId(request._id);
    try {
      const result = await accessRequestService.aprovar(request._id);
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      setDialog({ kind: 'password', email: result.email, senha: result.senhaInicial });
    } catch (err) {
      setDialog((current) => (current?.kind === 'password' ? current : null));
      const status = statusDoErro(err);
      const msg = extrairErro(err).toLowerCase();
      if (status === 409) {
        if (msg.includes('decidida')) {
          showError(t('accessRequests.alreadyDecided'));
          setAttempt((v) => v + 1);
        } else if (msg.includes('e-mail') || msg.includes('email')) {
          showError(t('accessRequests.conflictEmail'));
        } else if (msg.includes('empresa')) {
          showError(t('accessRequests.conflictCompany'));
        } else {
          showError(t('accessRequests.saveError'));
        }
      } else {
        showError(t('accessRequests.saveError'));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async (motivo: string) => {
    if (!dialog || dialog.kind !== 'reject' || busyId !== null) return;
    const { request } = dialog;
    setBusyId(request._id);
    try {
      await accessRequestService.recusar(request._id, motivo);
      setRequests((prev) => prev.filter((r) => r._id !== request._id));
      setDialog(null);
      show(t('accessRequests.rejected'));
    } catch (err) {
      setDialog((current) => (current?.kind === 'password' ? current : null));
      const status = statusDoErro(err);
      const msg = extrairErro(err).toLowerCase();
      if (status === 409 && msg.includes('decidida')) {
        showError(t('accessRequests.alreadyDecided'));
        setAttempt((v) => v + 1);
      } else {
        showError(t('accessRequests.saveError'));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>{t('accessRequests.title')}</h1>
      </div>

      <div role="tablist" aria-label={t('accessRequests.title')} className={styles.tabList}>
        {TABS.map((tKey) => (
          <button
            key={tKey}
            type="button"
            role="tab"
            id={`tab-${tKey}`}
            aria-selected={tab === tKey}
            aria-controls={`panel-${tKey}`}
            className={`${styles.tab} ${tab === tKey ? styles.activeTab : ''}`}
            onClick={() => {
              if (tab !== tKey) {
                setTab(tKey);
              }
            }}
          >
            {t(`accessRequests.tabs.${tKey}`)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className={styles.tabPanel}
      >
        {loadState === 'loading' && (
          <PageSkeleton variant="grid" card="employee" gridClassName={styles.grid} />
        )}

        {loadState === 'error' && (
          <div role="alert" className={styles.errorState}>
            <p>{t('accessRequests.loadError')}</p>
            <button type="button" className={styles.retryButton} onClick={retry}>
              {t('common.retry')}
            </button>
          </div>
        )}

        {loadState === 'ready' && requests.length === 0 && (
          <div role="status" className={styles.emptyState}>
            <p>{t(`accessRequests.empty.${tab}`)}</p>
          </div>
        )}

        {loadState === 'ready' && requests.length > 0 && (
          <div className={styles.grid}>
            {requests.map((req) => (
              <AccessRequestCard
                key={req._id}
                request={req}
                onAccept={
                  tab === 'pendente'
                    ? () => setDialog({ kind: 'accept', request: req })
                    : undefined
                }
                onReject={
                  tab === 'pendente'
                    ? () => setDialog({ kind: 'reject', request: req })
                    : undefined
                }
                busy={busyId === req._id}
              />
            ))}
          </div>
        )}
      </div>

      {dialog?.kind === 'accept' && (
        <ConfirmDialog
          title={t('accessRequests.acceptTitle')}
          message={t('accessRequests.acceptMessage', { company: dialog.request.nomeEmpresa })}
          confirmLabel={t('accessRequests.accept')}
          onConfirm={handleConfirmAccept}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'reject' && (
        <RejectDialog
          onConfirm={handleConfirmReject}
          onCancel={() => setDialog(null)}
        />
      )}

      {dialog?.kind === 'password' && (
        <InitialPasswordModal
          email={dialog.email}
          senha={dialog.senha}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  );
};

export default SolicitacoesPage;

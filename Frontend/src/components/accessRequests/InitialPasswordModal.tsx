import React from 'react';
import { Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import buttons from '../common/DialogButtons.module.css';
import formStyles from '../team/TeamForm.module.css';

interface InitialPasswordModalProps {
  email: string;
  senha: string;
  onClose: () => void;
}

const InitialPasswordModal: React.FC<InitialPasswordModalProps> = ({ email, senha, onClose }) => {
  const { t } = useTranslation();
  const toast = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(senha);
      toast.show(t('accessRequests.copied'));
    } catch {
      // Sem permissão de área de transferência: a senha continua visível e selecionável no campo.
    }
  };

  return (
    <Modal title={t('accessRequests.passwordTitle')} onClose={onClose}>
      <div className={formStyles.form}>
        <div className={formStyles.field}>
          <span className={formStyles.label}>{t('accessRequests.email')}</span>
          <div className={formStyles.input} style={{ display: 'flex', alignItems: 'center' }}>
            {email}
          </div>
        </div>

        <div className={formStyles.field}>
          <span className={formStyles.label}>{t('accessRequests.passwordLabel')}</span>
          <div className={formStyles.inputWrap}>
            <input
              type="text"
              readOnly
              value={senha}
              className={formStyles.input}
              style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}
            />
            <button
              type="button"
              className={formStyles.rightButton}
              onClick={handleCopy}
              aria-label={t('accessRequests.copy')}
              title={t('accessRequests.copy')}
            >
              <Copy size={16} />
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '10px 12px',
            borderRadius: '5px',
            backgroundColor: 'var(--bg-page)',
            border: '0.5px solid var(--border)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--text-h)',
            lineHeight: 1.4,
          }}
        >
          {t('accessRequests.passwordWarning')}
        </div>

        <div className={buttons.actions}>
          <button
            type="button"
            className={buttons.confirm}
            onClick={handleCopy}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Copy size={14} />
            {t('accessRequests.copy')}
          </button>
          <button
            type="button"
            className={buttons.cancel}
            onClick={onClose}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default InitialPasswordModal;

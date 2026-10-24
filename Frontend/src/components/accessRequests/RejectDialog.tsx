import React, { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../common/Modal';
import buttons from '../common/DialogButtons.module.css';
import formStyles from '../team/TeamForm.module.css';

interface RejectDialogProps {
  onConfirm: (motivo: string) => void;
  onCancel: () => void;
}

const RejectDialog: React.FC<RejectDialogProps> = ({ onConfirm, onCancel }) => {
  const { t } = useTranslation();
  const [motivo, setMotivo] = useState('');
  const id = useId();
  const textareaId = `${id}-motivo`;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onConfirm(motivo);
  };

  return (
    <Modal title={t('accessRequests.rejectTitle')} onClose={onCancel}>
      <form className={formStyles.form} onSubmit={handleSubmit} noValidate>
        <div className={formStyles.field}>
          <label htmlFor={textareaId} className={formStyles.label}>
            {t('accessRequests.reasonLabel')}
          </label>
          <textarea
            id={textareaId}
            className={formStyles.input}
            style={{ minHeight: '80px', height: 'auto', resize: 'vertical' }}
            maxLength={200}
            placeholder={t('accessRequests.reasonPlaceholder')}
            value={motivo}
            onChange={(event) => setMotivo(event.target.value)}
          />
        </div>
        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={buttons.confirm}>
            {t('accessRequests.reject')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectDialog;

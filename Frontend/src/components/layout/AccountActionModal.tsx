import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Modal from '../common/Modal';
import { useToast } from '../common/Toast';
import { authService } from '../../services/authService';
import buttons from '../common/DialogButtons.module.css';
import formStyles from '../team/TeamForm.module.css';

export interface AccountActionModalProps {
  mode: 'email' | 'senha' | 'excluir';
  onDone: (email?: string) => void;
  onCancel: () => void;
}

const AccountActionModal: React.FC<AccountActionModalProps> = ({ mode, onDone, onCancel }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();

  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getTitle = () => {
    switch (mode) {
      case 'email':
        return t('profile.editEmail');
      case 'senha':
        return t('profile.editPassword');
      case 'excluir':
        return t('profile.deleteAccount');
    }
  };

  const isFormValid = () => {
    const hasSenhaAtual = senhaAtual.trim().length > 0;
    if (mode === 'email') {
      return novoEmail.trim().length > 0 && hasSenhaAtual;
    }
    if (mode === 'senha') {
      return novaSenha.length >= 8 && hasSenhaAtual;
    }
    if (mode === 'excluir') {
      return hasSenhaAtual;
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || !isFormValid()) return;

    setSaving(true);
    setErrorMessage(null);

    try {
      if (mode === 'email') {
        const emailNormalizado = novoEmail.trim().toLowerCase();
        await authService.atualizarConta({ senhaAtual, email: emailNormalizado });
        toast.show(t('profile.emailChanged'));
        onDone(emailNormalizado);
      } else if (mode === 'senha') {
        await authService.atualizarConta({ senhaAtual, novaSenha });
        toast.show(t('profile.passwordChanged'));
        onDone();
      } else if (mode === 'excluir') {
        await authService.excluirConta(senhaAtual);
        navigate('/login');
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 403) {
          setErrorMessage(t('profile.wrongPassword'));
          return;
        }
        if (status === 409) {
          if (mode === 'email') {
            setErrorMessage(t('profile.emailInUse'));
            return;
          }
          if (mode === 'excluir') {
            setErrorMessage(t('profile.onlyAdmin'));
            return;
          }
        }
      }
      toast.showError(t('profile.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const disabled = saving || !isFormValid();

  return (
    <Modal title={getTitle()} onClose={onCancel}>
      <form onSubmit={handleSubmit} className={formStyles.form}>
        {mode === 'excluir' && (
          <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--danger-solid)', margin: 0 }}>
            {t('profile.deleteWarning')}
          </p>
        )}

        {mode === 'email' && (
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="novo-email">
              {t('profile.newEmail')}
            </label>
            <input
              id="novo-email"
              type="email"
              value={novoEmail}
              onChange={(e) => {
                setNovoEmail(e.target.value);
                setErrorMessage(null);
              }}
              className={formStyles.input}
              disabled={saving}
              autoFocus
            />
          </div>
        )}

        {mode === 'senha' && (
          <div className={formStyles.field}>
            <label className={formStyles.label} htmlFor="nova-senha">
              {t('profile.newPassword')}
            </label>
            <input
              id="nova-senha"
              type="password"
              value={novaSenha}
              onChange={(e) => {
                setNovaSenha(e.target.value);
                setErrorMessage(null);
              }}
              className={formStyles.input}
              disabled={saving}
              autoFocus
            />
          </div>
        )}

        <div className={formStyles.field}>
          <label className={formStyles.label} htmlFor="senha-atual">
            {t('profile.currentPassword')}
          </label>
          <input
            id="senha-atual"
            type="password"
            value={senhaAtual}
            onChange={(e) => {
              setSenhaAtual(e.target.value);
              setErrorMessage(null);
            }}
            className={formStyles.input}
            disabled={saving}
            {...(mode === 'excluir' ? { autoFocus: true } : {})}
          />
        </div>

        {errorMessage && (
          <p role="alert" style={{ color: 'var(--danger-solid)', fontSize: 'var(--fs-sm)', margin: 0 }}>
            {errorMessage}
          </p>
        )}

        <div className={buttons.actions}>
          <button
            type="button"
            className={buttons.cancel}
            onClick={onCancel}
            disabled={saving}
            style={saving ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
          >
            {t('profile.cancel')}
          </button>
          <button
            type="submit"
            className={buttons.confirm}
            disabled={disabled}
            style={{
              ...(mode === 'excluir' ? { background: 'var(--danger-solid)' } : {}),
              ...(disabled ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
          >
            {mode === 'excluir' ? t('profile.delete') : t('profile.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountActionModal;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import Modal from '../common/Modal';
import { authService } from '../../services/authService';
import AccountActionModal from './AccountActionModal';
import styles from './ProfileModal.module.css';

export interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [view, setView] = useState<'profile' | 'email' | 'senha' | 'excluir'>('profile');
  const [email, setEmail] = useState<string>(() => authService.getSession()?.email ?? '');

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    onClose();
  };

  if (view === 'email') {
    return (
      <AccountActionModal
        mode="email"
        onDone={(novoEmail) => {
          if (novoEmail) setEmail(novoEmail);
          setView('profile');
        }}
        onCancel={() => setView('profile')}
      />
    );
  }

  if (view === 'senha') {
    return (
      <AccountActionModal
        mode="senha"
        onDone={() => setView('profile')}
        onCancel={() => setView('profile')}
      />
    );
  }

  if (view === 'excluir') {
    return (
      <AccountActionModal
        mode="excluir"
        onDone={() => {
          onClose();
        }}
        onCancel={() => setView('profile')}
      />
    );
  }

  return (
    <Modal title={t('profile.title')} onClose={onClose}>
      <div className={styles.container}>
        <div className={styles.row}>
          <span className={styles.label}>{t('profile.email')}</span>
          <div className={styles.valueGroup}>
            <span className={styles.value}>{email || '—'}</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => setView('email')}
              aria-label={t('profile.editEmail')}
              title={t('profile.editEmail')}
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>{t('profile.password')}</span>
          <div className={styles.valueGroup}>
            <span className={styles.value}>••••••••</span>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => setView('senha')}
              aria-label={t('profile.editPassword')}
              title={t('profile.editPassword')}
            >
              <Pencil size={16} />
            </button>
          </div>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.deleteButton}
            onClick={() => setView('excluir')}
          >
            {t('profile.deleteAccount')}
          </button>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            {t('profile.logout')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ProfileModal;

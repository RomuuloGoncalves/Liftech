import React, { useId } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import type { Sector } from '../../data/team'
import styles from './TeamForm.module.css'

interface SectorInfoModalProps {
  sector: Sector
  onClose: () => void
}

const SectorInfoModal: React.FC<SectorInfoModalProps> = ({ sector, onClose }) => {
  const { t } = useTranslation()
  const uid = useId()

  return (
    <Modal title={t('team.sectorInfoTitle')} onClose={onClose}>
      <div className={styles.form}>
        <div className={styles.field}>
          <label htmlFor={`${uid}-nome`} className={styles.label}>
            {t('team.labelSectorName')}
          </label>
          <input id={`${uid}-nome`} className={styles.input} value={sector.nome} readOnly />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${uid}-unidade`} className={styles.label}>
            {t('team.labelUnit')}
          </label>
          <input id={`${uid}-unidade`} className={styles.input} value={sector.unidade} readOnly />
        </div>
      </div>
    </Modal>
  )
}

export default SectorInfoModal

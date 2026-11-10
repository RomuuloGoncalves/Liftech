import React from 'react'
import { useTranslation, Trans } from 'react-i18next'
import Modal from '../common/Modal'
import { ACCIDENT_URGENCY, type AccidentCause, type UrgencyLevel } from '../../data/machines'
import styles from './LevelInfoModal.module.css'

const LEVEL_ORDER: UrgencyLevel[] = ['critica', 'alta', 'media']

const TONE: Record<UrgencyLevel, string> = {
  critica: styles.critical,
  alta: styles.high,
  media: styles.medium,
}

interface LevelInfoModalProps {
  onClose: () => void
}

const LevelInfoModal: React.FC<LevelInfoModalProps> = ({ onClose }) => {
  const { t } = useTranslation()

  const allCauses = Object.keys(ACCIDENT_URGENCY) as AccidentCause[]
  const levelsWithCauses = LEVEL_ORDER.map((level) => {
    const causes = allCauses.filter((cause) => ACCIDENT_URGENCY[cause] === level)
    return { level, causes }
  }).filter((item) => item.causes.length > 0)

  return (
    <Modal title={t('levelInfo.title')} onClose={onClose}>
      <ul className={styles.list}>
        {levelsWithCauses.map(({ level, causes }) => (
          <li
            key={level}
            className={`${styles.card} ${TONE[level] || ''}`.trim()}
            data-level={level}
          >
            <h3 className={styles.level}>{t(`levelInfo.level.${level}`)}</h3>
            {causes.map((cause) => (
              <p key={cause} className={styles.text}>
                <Trans
                  i18nKey={`levelInfo.description.${cause}`}
                  components={{ b: <strong /> }}
                />
              </p>
            ))}
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export default LevelInfoModal

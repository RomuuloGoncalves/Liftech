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

  const causes = Object.keys(ACCIDENT_URGENCY) as AccidentCause[]
  const levelsWithCause = LEVEL_ORDER.map((level) => {
    const cause = causes.find((c) => ACCIDENT_URGENCY[c] === level)
    return { level, cause }
  }).filter((item): item is { level: UrgencyLevel; cause: AccidentCause } => Boolean(item.cause))

  return (
    <Modal title={t('levelInfo.title')} onClose={onClose}>
      <ul className={styles.list}>
        {levelsWithCause.map(({ level, cause }) => (
          <li
            key={level}
            className={`${styles.card} ${TONE[level] || ''}`.trim()}
            data-level={level}
          >
            <h3 className={styles.level}>{t(`levelInfo.level.${level}`)}</h3>
            <p className={styles.text}>
              <Trans
                i18nKey={`levelInfo.description.${cause}`}
                components={{ b: <strong /> }}
              />
            </p>
          </li>
        ))}
      </ul>
    </Modal>
  )
}

export default LevelInfoModal

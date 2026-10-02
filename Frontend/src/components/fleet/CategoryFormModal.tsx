import React, { useId, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import buttons from '../common/DialogButtons.module.css'
import { CATEGORY_COLORS, categoryNameError, isHexColor } from '../../data/fleet'
import styles from './CategoryFormModal.module.css'

interface CategoryFormModalProps {
  existingNames: string[]
  onSubmit: (nome: string, cor: string) => void
  onClose: () => void
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ existingNames, onSubmit, onClose }) => {
  const { t } = useTranslation()
  const uid = useId()
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState(CATEGORY_COLORS[0])
  const [hex, setHex] = useState(CATEGORY_COLORS[0])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const choose = (color: string) => {
    setCor(color)
    setHex(color)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const problem = categoryNameError(nome, existingNames)
    if (problem) {
      setError(t(problem === 'required' ? 'fleet.required' : 'fleet.duplicateName'))
      return
    }
    onSubmit(nome.trim(), cor)
  }

  return (
    <Modal title={t('fleet.createTitle')} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.row}>
          <div className={styles.colorWrap}>
            <button
              type="button"
              className={styles.colorButton}
              aria-label={t('fleet.colorLabel')}
              aria-expanded={pickerOpen}
              data-color={cor}
              onClick={() => setPickerOpen((open) => !open)}
            >
              <span className={styles.dot} style={{ background: cor }} />
            </button>
            {pickerOpen && (
              <div className={styles.popover}>
                <button
                  type="button"
                  className={styles.popoverClose}
                  aria-label={t('fleet.closeColors')}
                  onClick={() => setPickerOpen(false)}
                >
                  <X size={10} />
                </button>
                <div className={styles.swatches}>
                  {CATEGORY_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={styles.swatch}
                      style={{ background: color }}
                      aria-label={color}
                      aria-pressed={cor === color}
                      onClick={() => choose(color)}
                    />
                  ))}
                </div>
                <label className={styles.hex}>
                  <span className={styles.dot} style={{ background: cor }} />
                  <span>{t('fleet.hexLabel')}</span>
                  <input
                    aria-label={t('fleet.hexLabel')}
                    value={hex}
                    maxLength={7}
                    onChange={(event) => {
                      setHex(event.target.value)
                      if (isHexColor(event.target.value)) setCor(event.target.value.toUpperCase())
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <div className={styles.nameField}>
            <input
              id={`${uid}-nome`}
              className={styles.nameInput}
              aria-label={t('fleet.nameLabel')}
              placeholder={t('fleet.namePlaceholder')}
              maxLength={30}
              value={nome}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-error` : undefined}
              onChange={(event) => setNome(event.target.value)}
            />
            {error && (
              <span id={`${uid}-error`} className={styles.error}>
                {error}
              </span>
            )}
          </div>
        </div>

        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={buttons.confirm}>
            {t('fleet.createSubmit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoryFormModal

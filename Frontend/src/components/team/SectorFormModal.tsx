import React, { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import buttons from '../common/DialogButtons.module.css'
import type { Sector } from '../../data/team'
import styles from './TeamForm.module.css'

export interface SectorFormValues {
  nome: string
  unidade: string
}

interface SectorFormModalProps {
  sector?: Sector
  onSave: (values: SectorFormValues) => void
  onClose: () => void
}

const SectorFormModal: React.FC<SectorFormModalProps> = ({ sector, onSave, onClose }) => {
  const { t } = useTranslation()
  const uid = useId()
  const [values, setValues] = useState<SectorFormValues>({ nome: sector?.nome ?? '', unidade: sector?.unidade ?? '' })
  const [errors, setErrors] = useState<Partial<Record<keyof SectorFormValues, string>>>({})

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (values.nome.trim() === '') next.nome = t('team.required')
    if (values.unidade.trim() === '') next.unidade = t('team.required')
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSave({ nome: values.nome.trim(), unidade: values.unidade.trim() })
  }

  const field = (name: keyof SectorFormValues, label: string, placeholder: string) => {
    const id = `${uid}-${name}`
    const error = errors[name]
    return (
      <div className={styles.field}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <input
          id={id}
          type="text"
          className={`${styles.input} ${error ? styles.invalid : ''}`}
          placeholder={placeholder}
          value={values[name]}
          onChange={(event) => setValues((prev) => ({ ...prev, [name]: event.target.value }))}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoComplete="off"
        />
        {error && (
          <span id={`${id}-error`} className={styles.error}>
            {error}
          </span>
        )}
      </div>
    )
  }

  return (
    <Modal title={sector ? t('team.editSectorTitle') : t('team.newSectorTitle')} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {field('nome', t('team.labelSectorName'), t('team.phSectorName'))}
        {field('unidade', t('team.labelUnit'), t('team.phUnit'))}
        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={buttons.confirm}>
            {sector ? t('team.confirm') : t('team.createSector')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default SectorFormModal

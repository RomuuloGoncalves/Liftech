import React, { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import Select from '../common/Select'
import Spinner from '../common/Spinner'
import buttons from '../common/DialogButtons.module.css'
import type { Sector } from '../../data/team'
import type { Filial } from '../../services/authService'
import styles from './TeamForm.module.css'

export interface SectorFormValues {
  nome: string
  filialId: string
}

interface SectorFormModalProps {
  sector?: Sector
  branches: Filial[]
  /** Company scope: may pick any branch, also to move an existing sector. */
  canMove: boolean
  defaultFilialId?: string
  onSave: (values: SectorFormValues) => Promise<void> | void
  onClose: () => void
}

const SectorFormModal: React.FC<SectorFormModalProps> = ({ sector, branches, canMove, defaultFilialId, onSave, onClose }) => {
  const { t } = useTranslation()
  const uid = useId()
  const [values, setValues] = useState<SectorFormValues>({
    nome: sector?.nome ?? '',
    filialId: sector?.filialId ?? defaultFilialId ?? branches[0]?._id ?? '',
  })
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)
  // Branch scope only picks the branch on create, and only with more than one to pick from.
  const showSelect = canMove || (!sector && branches.length >= 2)
  const branchName = sector?.filial.nome ?? branches.find((b) => b._id === values.filialId)?.nome ?? ''

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    if (values.nome.trim() === '') {
      setError(t('team.required'))
      return
    }
    setSaving(true)
    try {
      await onSave({ nome: values.nome.trim(), filialId: values.filialId })
    } catch {
      // Keep form open on failure
    } finally {
      setSaving(false)
    }
  }

  const nomeId = `${uid}-nome`
  const filialId = `${uid}-filialId`

  return (
    <Modal title={sector ? t('team.editSectorTitle') : t('team.newSectorTitle')} onClose={saving ? () => {} : onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor={nomeId} className={styles.label}>
            {t('team.labelSectorName')}
          </label>
          <input
            id={nomeId}
            type="text"
            className={`${styles.input} ${error ? styles.invalid : ''}`}
            placeholder={t('team.phSectorName')}
            value={values.nome}
            onChange={(event) => setValues((prev) => ({ ...prev, nome: event.target.value }))}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${nomeId}-error` : undefined}
            autoComplete="off"
            disabled={saving}
          />
          {error && (
            <span id={`${nomeId}-error`} className={styles.error}>
              {error}
            </span>
          )}
        </div>
        <div className={styles.field}>
          <label htmlFor={filialId} className={styles.label}>
            {t('team.labelSectorBranch')}
          </label>
          {showSelect ? (
            <Select
              id={filialId}
              value={values.filialId}
              disabled={saving}
              onChange={(val) => setValues((prev) => ({ ...prev, filialId: val }))}
              options={branches.map((branch) => ({
                value: branch._id,
                label: branch.nome,
              }))}
            />
          ) : (
            <input id={filialId} className={styles.input} value={branchName} readOnly />
          )}
        </div>
        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={buttons.confirm} disabled={saving} aria-busy={saving}>
            {saving && <Spinner />}
            {saving ? t('common.saving') : (sector ? t('team.confirm') : t('team.createSector'))}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default SectorFormModal

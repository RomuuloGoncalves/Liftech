import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import styles from './NewMachinePanel.module.css'

export interface NewMachineFormValues {
  nome: string
  identificacao: string
  setor: string
  nomeDispositivo: string
  enderecoMac: string
}

interface NewMachinePanelProps {
  onClose: () => void
  onCreate: (values: NewMachineFormValues) => void
}

const EMPTY_FORM: NewMachineFormValues = {
  nome: '',
  identificacao: '',
  setor: '',
  nomeDispositivo: '',
  enderecoMac: '',
}

const NewMachinePanel: React.FC<NewMachinePanelProps> = ({ onClose, onCreate }) => {
  const { t } = useTranslation()
  const [values, setValues] = useState<NewMachineFormValues>(EMPTY_FORM)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const updateField = (field: keyof NewMachineFormValues) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose()
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCreate(values)
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div
        className={styles.panel}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('machines.newMachineTitle')}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{t('machines.newMachineTitle')}</h2>
              <p className={styles.subtitle}>{t('machines.newMachineSubtitle')}</p>
            </div>
            <button type="button" className={styles.closeButton} aria-label={t('common.close')} onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>{t('machines.labelName')}</span>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: Empilhadeira Elétrica Titan-X"
                value={values.nome}
                onChange={updateField('nome')}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{t('machines.labelId')}</span>
              <input
                type="text"
                className={styles.input}
                placeholder="EMP-084"
                value={values.identificacao}
                onChange={updateField('identificacao')}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{t('machines.labelSector')}</span>
              <input
                type="text"
                className={styles.input}
                placeholder="Ex: Expedição - Bloco B"
                value={values.setor}
                onChange={updateField('setor')}
              />
            </label>

            <div className={styles.divider} />

            <label className={styles.field}>
              <span className={styles.label}>{t('machines.labelDeviceName')}</span>
              <input
                type="text"
                className={styles.input}
                placeholder="AA:BB:CC:DD:EE:FF"
                value={values.nomeDispositivo}
                onChange={updateField('nomeDispositivo')}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{t('machines.labelMac')}</span>
              <input
                type="text"
                className={styles.input}
                placeholder="AA:BB:CC:DD:EE:FF"
                value={values.enderecoMac}
                onChange={updateField('enderecoMac')}
              />
            </label>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitButton}>
              {t('common.save')}
            </button>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewMachinePanel

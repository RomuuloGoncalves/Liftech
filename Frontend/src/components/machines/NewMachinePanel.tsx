import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Machine } from '../../data/machines'
import type { Filial } from '../../services/authService'
import type { Setor } from '../../services/sectorService'
import styles from './NewMachinePanel.module.css'

export interface NewMachineFormValues {
  nome: string
  identificacao: string
  /** '' = no sector. */
  setorId: string
  nomeDispositivo: string
  enderecoMac: string
  /** Only set on create when the branch picker is shown. */
  filialId?: string
}

interface NewMachinePanelProps {
  /** When given, the panel edits this machine; `onCreate` receives the edited values. */
  machine?: Machine
  /** With 2+ branches the create form asks which branch the machine belongs to. */
  branches?: Filial[]
  /** Sectors of the page; the select shows those of the form's branch. */
  sectors: Setor[]
  /** Branch of a new machine when the form has no branch picker. */
  defaultFilialId?: string
  onClose: () => void
  onCreate: (values: NewMachineFormValues) => void
}

const EMPTY_FORM: NewMachineFormValues = {
  nome: '',
  identificacao: '',
  setorId: '',
  nomeDispositivo: '',
  enderecoMac: '',
}

const NewMachinePanel: React.FC<NewMachinePanelProps> = ({ machine, branches = [], sectors, defaultFilialId, onClose, onCreate }) => {
  const { t } = useTranslation()
  const isEdit = machine !== undefined
  const showBranch = !isEdit && branches.length >= 2
  const [values, setValues] = useState<NewMachineFormValues>(
    machine
      ? {
          nome: machine.nome,
          identificacao: machine.identificacao,
          setorId: machine.setorId ?? '',
          nomeDispositivo: machine.dispositivoConectado.nomeDispositivo ?? '',
          enderecoMac: machine.dispositivoConectado.enderecoMac,
        }
      : showBranch
        ? { ...EMPTY_FORM, filialId: branches[0]._id }
        : EMPTY_FORM
  )
  const formFilialId = values.filialId ?? machine?.filialId ?? defaultFilialId
  const branchSectors = formFilialId ? sectors.filter((sector) => sector.filialId === formFilialId) : sectors
  const title = isEdit ? t('machines.editMachineTitle') : t('machines.newMachineTitle')
  const subtitle = isEdit ? t('machines.editMachineSubtitle') : t('machines.newMachineSubtitle')
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const updateField = (field: keyof NewMachineFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  // A sector belongs to one branch: a new branch drops the picked sector.
  const changeBranch = (event: React.ChangeEvent<HTMLSelectElement>) =>
    setValues((prev) => ({ ...prev, filialId: event.target.value, setorId: '' }))

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
        aria-label={title}
      >
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{title}</h2>
              <p className={styles.subtitle}>{subtitle}</p>
            </div>
            <button type="button" className={styles.closeButton} aria-label={t('common.close')} onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>{isEdit ? t('machines.editLabelMachine') : t('machines.labelName')}</span>
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
              <span className={styles.label}>{isEdit ? t('machines.editLabelCode') : t('machines.labelId')}</span>
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
              <select className={styles.input} value={values.setorId} onChange={updateField('setorId')}>
                <option value="">{t('machines.sectorNone')}</option>
                {branchSectors.map((sector) => (
                  <option key={sector._id} value={sector._id}>
                    {sector.nome}
                  </option>
                ))}
              </select>
            </label>

            {showBranch && (
              <label className={styles.field}>
                <span className={styles.label}>{t('machines.labelBranch')}</span>
                <select className={styles.input} value={values.filialId} onChange={changeBranch}>
                  {branches.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.nome}
                    </option>
                  ))}
                </select>
              </label>
            )}

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
              <span className={styles.label}>{isEdit ? t('machines.editLabelMac') : t('machines.labelMac')}</span>
              <input
                type="text"
                className={styles.input}
                placeholder="AA:BB:CC:DD:EE:FF"
                value={values.enderecoMac}
                onChange={updateField('enderecoMac')}
                required
              />
            </label>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitButton}>
              {isEdit ? t('machines.editMachineSubmit') : t('common.save')}
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

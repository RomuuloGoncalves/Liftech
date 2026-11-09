import React, { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Machine } from '../../data/machines'
import type { Filial } from '../../services/authService'
import type { Setor } from '../../services/sectorService'
import Select from '../common/Select'
import Spinner from '../common/Spinner'
import styles from './NewMachinePanel.module.css'

export interface NewMachineFormValues {
  nome: string
  identificacao: string
  /** '' = no sector. */
  setorId: string
  nomeDispositivo: string
  enderecoMac: string
  /** Definida na criação a partir das filiais informadas: escolhida no formulário havendo 2+, ou a única sem perguntar. */
  filialId?: string
}

interface NewMachinePanelProps {
  /** Quando informada, o painel edita esta máquina; `onCreate` recebe os valores editados. */
  machine?: Machine
  /** Com 2+ filiais o formulário de cadastro pergunta a qual filial a máquina pertence. */
  branches?: Filial[]
  /** Setores da página; o seletor exibe os da filial do formulário. */
  sectors: Setor[]
  /** Filial de uma nova máquina quando o formulário não tem seletor de filial. */
  defaultFilialId?: string
  onClose: () => void
  onCreate: (values: NewMachineFormValues) => void | Promise<void>
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
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<NewMachineFormValues>(
    machine
      ? {
          nome: machine.nome,
          identificacao: machine.identificacao,
          setorId: machine.setorId ?? '',
          nomeDispositivo: machine.dispositivoConectado.nomeDispositivo ?? '',
          enderecoMac: machine.dispositivoConectado.enderecoMac,
        }
      : branches.length > 0
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
      if (event.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, saving])

  const updateField = (field: keyof NewMachineFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!saving && event.target === event.currentTarget) onClose()
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await onCreate(values)
      onClose()
    } catch {
      // ignora
    } finally {
      setSaving(false)
    }
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
            <button
              type="button"
              className={styles.closeButton}
              aria-label={t('common.close')}
              onClick={onClose}
              disabled={saving}
            >
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
                disabled={saving}
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
                disabled={saving}
                required
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>{t('machines.labelSector')}</span>
              <Select
                value={values.setorId}
                onChange={(val) => setValues((prev) => ({ ...prev, setorId: val }))}
                ariaLabel={t('machines.labelSector')}
                disabled={saving}
                options={[
                  { value: '', label: t('machines.sectorNone') },
                  ...branchSectors.map((sector) => ({
                    value: sector._id,
                    label: sector.nome,
                  })),
                ]}
              />
            </label>

            {showBranch && (
              <label className={styles.field}>
                <span className={styles.label}>{t('machines.labelBranch')}</span>
                <Select
                  value={values.filialId ?? ''}
                  onChange={(val) =>
                    setValues((prev) => ({ ...prev, filialId: val, setorId: '' }))
                  }
                  ariaLabel={t('machines.labelBranch')}
                  disabled={saving}
                  options={branches.map((branch) => ({
                    value: branch._id,
                    label: branch.nome,
                  }))}
                />
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
                disabled={saving}
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
                disabled={saving}
                required
              />
            </label>
          </div>

          <div className={styles.footer}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={saving}
              aria-busy={saving}
            >
              {saving && <Spinner />}
              {isEdit ? t('machines.editMachineSubmit') : t('common.save')}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={saving}
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewMachinePanel

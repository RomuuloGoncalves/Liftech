import React, { useId, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import buttons from '../common/DialogButtons.module.css'
import { CATEGORY_COLORS, categoryNameError, isHexColor } from '../../data/fleet'
import { MACHINE_STATUSES, type MachineStatus } from '../../data/machines'
import styles from './CategoryFormModal.module.css'

export interface CategoryFormValues {
  nome: string
  cor: string
  statusVinculados: MachineStatus[]
}

interface CategoryFormModalProps {
  /** Nomes das outras categorias, para recusar repetido. */
  existingNames: string[]
  /** Com valores, o modal edita; sem, cria. */
  initial?: CategoryFormValues
  /** Status já ligados a outra categoria: ficam desabilitados. */
  takenStatus?: MachineStatus[]
  /** Se rejeitar, o formulário fica aberto com o aviso de erro. */
  onSubmit: (values: CategoryFormValues) => void | Promise<void>
  onClose: () => void
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  existingNames,
  initial,
  takenStatus = [],
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation()
  const uid = useId()
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [cor, setCor] = useState(initial?.cor ?? CATEGORY_COLORS[0])
  const [hex, setHex] = useState(initial?.cor ?? CATEGORY_COLORS[0])
  const [linked, setLinked] = useState<MachineStatus[]>(initial?.statusVinculados ?? [])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  // Posição fixa: o Modal tem overflow e cortaria o popover, que no Figma sai para fora dele.
  const [pickerAt, setPickerAt] = useState<{ top: number; left: number } | null>(null)
  const pickerOpen = pickerAt !== null
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
    setError(null)
    setSaveError(false)
    setSaving(true)
    // Mantém a ordem dos códigos, não a dos cliques.
    const statusVinculados = MACHINE_STATUSES.filter((status) => linked.includes(status))
    Promise.resolve(onSubmit({ nome: nome.trim(), cor, statusVinculados })).catch(() => {
      setSaveError(true)
      setSaving(false)
    })
  }

  const toggle = (status: MachineStatus) =>
    setLinked((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))

  return (
    <Modal title={t(initial ? 'fleet.editCategory' : 'fleet.createTitle')} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.row}>
          <div className={styles.colorWrap}>
            <button
              type="button"
              className={styles.colorButton}
              aria-label={t('fleet.colorLabel')}
              aria-expanded={pickerOpen}
              data-color={cor}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                setPickerAt(pickerOpen ? null : { top: rect.bottom + 8, left: rect.left - 75 })
              }}
            >
              <span className={styles.dot} style={{ background: cor }} />
            </button>
            {pickerOpen && (
              <div className={styles.popover} style={pickerAt}>
                <button
                  type="button"
                  className={styles.popoverClose}
                  aria-label={t('fleet.closeColors')}
                  onClick={() => setPickerAt(null)}
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

        <fieldset className={styles.statusList}>
          <legend>{t('fleet.linkedStatus')}</legend>
          {MACHINE_STATUSES.map((status) => {
            const taken = takenStatus.includes(status)
            return (
              <label key={status} className={styles.statusOption}>
                <input
                  type="checkbox"
                  checked={linked.includes(status)}
                  disabled={taken}
                  aria-describedby={taken ? `${uid}-taken-${status}` : undefined}
                  onChange={() => toggle(status)}
                />
                {t(`machines.status.${status}`)}
                {taken && (
                  <span id={`${uid}-taken-${status}`} className={styles.taken}>
                    {t('fleet.statusTaken')}
                  </span>
                )}
              </label>
            )
          })}
        </fieldset>

        {saveError && (
          <p role="alert" className={styles.error}>
            {t('fleet.saveError')}
          </p>
        )}

        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button type="submit" className={buttons.confirm} disabled={saving}>
            {t(initial ? 'common.save' : 'fleet.createSubmit')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CategoryFormModal

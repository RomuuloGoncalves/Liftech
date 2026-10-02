import React, { useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../common/Modal'
import buttons from '../common/DialogButtons.module.css'
import { matchesMachine } from '../../data/fleet'
import type { Machine } from '../../data/machines'
import styles from './MachinePickerModal.module.css'

interface MachinePickerModalProps {
  /** Só as máquinas sem categoria. */
  machines: Machine[]
  onConfirm: (machineIds: string[]) => void
  onClose: () => void
}

const MachinePickerModal: React.FC<MachinePickerModalProps> = ({ machines, onConfirm, onClose }) => {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const byId = new Map(machines.map((m) => [m.id, m]))
  const visible = machines.filter((m) => matchesMachine(m, query))

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((other) => other !== id) : [...prev, id]))

  return (
    <Modal title={t('fleet.pickerTitle')} onClose={onClose}>
      <div className={styles.body}>
        <div className={styles.chips} role="group" aria-label={t('fleet.pickerSelected')}>
          <ul>
            {selected.map((id) => {
              const code = byId.get(id)!.identificacao
              return (
                <li key={id} className={styles.chip}>
                  {code}(ID)
                  <button
                    type="button"
                    className={styles.chipRemove}
                    aria-label={t('fleet.removeChip', { name: code })}
                    onClick={() => toggle(id)}
                  >
                    <X size={8} />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {machines.length === 0 ? (
          <p className={styles.empty}>{t('fleet.pickerEmpty')}</p>
        ) : (
          <>
            <label className={styles.search}>
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder={t('fleet.pickerSearchPlaceholder')}
                aria-label={t('fleet.pickerSearchPlaceholder')}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <ul className={styles.list} role="listbox" aria-multiselectable="true" aria-label={t('fleet.pickerTitle')}>
              {visible.map((machine) => {
                const isSelected = selected.includes(machine.id)
                return (
                  <li
                    key={machine.id}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={0}
                    className={styles.option}
                    onClick={() => toggle(machine.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        toggle(machine.id)
                      }
                    }}
                  >
                    {machine.identificacao}(ID)
                    {isSelected && <Check size={12} aria-hidden="true" />}
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <div className={buttons.actions}>
          <button type="button" className={buttons.cancel} onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className={buttons.confirm}
            disabled={selected.length === 0}
            onClick={() => onConfirm(selected)}
          >
            {t('fleet.pickerConfirm')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default MachinePickerModal

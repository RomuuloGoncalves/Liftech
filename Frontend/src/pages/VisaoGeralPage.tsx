import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search } from 'lucide-react'
import MachineCard from '../components/machines/MachineCard'
import ConfirmDialog from '../components/common/ConfirmDialog'
import MachineDetailModal from '../components/machines/MachineDetailModal'
import NewMachinePanel, { type NewMachineFormValues } from '../components/machines/NewMachinePanel'
import {
  MACHINES,
  MACHINE_STATUSES,
  eventsForMachine,
  filterMachines,
  type Machine,
  type MachineStatus,
} from '../data/machines'
import styles from './VisaoGeralPage.module.css'

type StatusFilter = MachineStatus | 'Todos'

let nextMachineId = MACHINES.length + 1

const VisaoGeralPage: React.FC = () => {
  const { t } = useTranslation()
  const [allMachines, setAllMachines] = useState<Machine[]>(MACHINES)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('Todos')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [subDialog, setSubDialog] = useState<'edit' | 'delete' | null>(null)

  const detailMachine = allMachines.find((machine) => machine.id === detailId)

  const machines = useMemo(() => filterMachines(allMachines, { query, status }), [allMachines, query, status])

  const getStatusTranslation = (s: string) => {
    if (s === 'Disponível') return t('machines.statusAvailable')
    if (s === 'Em uso') return t('machines.statusInUse')
    if (s === 'Manutenção' || s === 'Em manutenção') return t('machines.statusMaintenance')
    return s
  }

  const handleCreateMachine = (values: NewMachineFormValues) => {
    const newMachine: Machine = {
      id: String(nextMachineId++),
      identificacao: values.identificacao,
      nome: values.nome,
      setor: values.setor,
      dispositivoConectado: {
        enderecoMac: values.enderecoMac,
        status: 'Disponível',
        nomeDispositivo: values.nomeDispositivo,
      },
      tempoSessaoMinutos: 0,
      tempoUsoTotalHoras: 0,
    }
    setAllMachines((prev) => [newMachine, ...prev])
    setIsPanelOpen(false)
  }

  const handleEditMachine = (values: NewMachineFormValues) => {
    setAllMachines((prev) =>
      prev.map((machine) =>
        machine.id === detailId
          ? {
              ...machine,
              nome: values.nome,
              identificacao: values.identificacao,
              setor: values.setor,
              dispositivoConectado: {
                ...machine.dispositivoConectado,
                enderecoMac: values.enderecoMac,
                nomeDispositivo: values.nomeDispositivo,
              },
            }
          : machine
      )
    )
    setSubDialog(null)
  }

  const handleDeleteMachine = () => {
    setAllMachines((prev) => prev.filter((machine) => machine.id !== detailId))
    setSubDialog(null)
    setDetailId(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.registerButton} onClick={() => setIsPanelOpen(true)}>
          <Plus size={16} />
          {t('machines.registerButton')}
        </button>

        <div className={styles.searchField}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder={t('machines.searchPlaceholder')}
            aria-label="Buscar máquina por identificação ou setor"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <select
          className={styles.statusSelect}
          aria-label="Filtrar máquinas por status"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
        >
          <option value="Todos">{t('machines.filterDefault')}</option>
          {MACHINE_STATUSES.map((option) => (
            <option key={option} value={option}>
              {getStatusTranslation(option)}
            </option>
          ))}
        </select>
      </div>

      {machines.length === 0 ? (
        <p className={styles.emptyState}>{t('machines.emptyState')}</p>
      ) : (
        <div className={styles.grid}>
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} onOpen={(item) => setDetailId(item.id)} />
          ))}
        </div>
      )}

      {isPanelOpen && (
        <NewMachinePanel onClose={() => setIsPanelOpen(false)} onCreate={handleCreateMachine} />
      )}

      {detailMachine && subDialog === null && (
        <MachineDetailModal
          machine={detailMachine}
          events={eventsForMachine(detailMachine.id)}
          onEdit={() => setSubDialog('edit')}
          onDelete={() => setSubDialog('delete')}
          onClose={() => setDetailId(null)}
        />
      )}
      {detailMachine && subDialog === 'edit' && (
        <NewMachinePanel machine={detailMachine} onClose={() => setSubDialog(null)} onCreate={handleEditMachine} />
      )}
      {detailMachine && subDialog === 'delete' && (
        <ConfirmDialog
          title={t('machines.deleteMachineTitle')}
          message={t('machines.deleteMachineMessage', { name: `${detailMachine.nome} (${detailMachine.identificacao})` })}
          onConfirm={handleDeleteMachine}
          onCancel={() => setSubDialog(null)}
        />
      )}
    </div>
  )
}

export default VisaoGeralPage

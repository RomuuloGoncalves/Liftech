import React, { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import MachineCard from '../components/machines/MachineCard'
import NewMachinePanel, { type NewMachineFormValues } from '../components/machines/NewMachinePanel'
import { MACHINES, MACHINE_STATUSES, filterMachines, type Machine, type MachineStatus } from '../data/machines'
import styles from './VisaoGeralPage.module.css'

type StatusFilter = MachineStatus | 'Todos'

let nextMachineId = MACHINES.length + 1

const VisaoGeralPage: React.FC = () => {
  const [allMachines, setAllMachines] = useState<Machine[]>(MACHINES)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('Todos')
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const machines = useMemo(() => filterMachines(allMachines, { query, status }), [allMachines, query, status])

  const handleCreateMachine = (values: NewMachineFormValues) => {
    const newMachine: Machine = {
      id: String(nextMachineId++),
      identificacao: values.identificacao,
      nome: values.nome,
      setor: values.setor,
      dispositivoConectado: {
        enderecoMac: values.enderecoMac,
        status: 'Disponível',
      },
      tempoSessaoMinutos: 0,
    }
    setAllMachines((prev) => [newMachine, ...prev])
    setIsPanelOpen(false)
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.registerButton} onClick={() => setIsPanelOpen(true)}>
          <Plus size={16} />
          Cadastrar Máquina
        </button>

        <div className={styles.searchField}>
          <Search size={16} className={styles.searchIcon} aria-hidden="true" />
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search..."
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
          <option value="Todos">Padrão</option>
          {MACHINE_STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      {machines.length === 0 ? (
        <p className={styles.emptyState}>Nenhuma máquina encontrada</p>
      ) : (
        <div className={styles.grid}>
          {machines.map((machine) => (
            <MachineCard key={machine.id} machine={machine} />
          ))}
        </div>
      )}

      {isPanelOpen && (
        <NewMachinePanel onClose={() => setIsPanelOpen(false)} onCreate={handleCreateMachine} />
      )}
    </div>
  )
}

export default VisaoGeralPage

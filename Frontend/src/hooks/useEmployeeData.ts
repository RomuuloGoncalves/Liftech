import { useEffect, useState } from 'react'
import { toUsageRecord, type UsageRecord } from '../data/employeeArea'
import type { Machine } from '../data/machines'
import { machineService } from '../services/machineService'
import { sessionService } from '../services/sessionService'

/** Máquinas no escopo e o histórico de uso do colaborador, mais recentes primeiro. */
export function useEmployeeData() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stale = false

    Promise.allSettled([machineService.listar(), sessionService.listar()]).then(([resMachines, resSessions]) => {
      if (stale) return
      if (resMachines.status === 'fulfilled') {
        setMachines(resMachines.value)
      }
      if (resSessions.status === 'fulfilled') {
        setRecords(resSessions.value.map((s) => toUsageRecord(s)))
      }
      setLoading(false)
    })

    return () => {
      stale = true
    }
  }, [])

  return { machines, records, loading }
}

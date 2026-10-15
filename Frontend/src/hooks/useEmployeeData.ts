import { useEffect, useState } from 'react'
import { toUsageRecord, type UsageRecord } from '../data/employeeArea'
import type { Machine } from '../data/machines'
import { machineService } from '../services/machineService'
import { sessionService } from '../services/sessionService'

/** Machines in scope and the collaborator's usage history, most recent first. */
export function useEmployeeData() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [records, setRecords] = useState<UsageRecord[]>([])

  useEffect(() => {
    let stale = false
    // ponytail: a failed request leaves the list empty, add an error state if users need to retry.
    machineService.listar().then((list) => !stale && setMachines(list), () => {})
    sessionService.listar().then((list) => !stale && setRecords(list.map((s) => toUsageRecord(s))), () => {})
    return () => {
      stale = true
    }
  }, [])

  return { machines, records }
}

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { summarize } from '@/domain/ledger/selectors'
import type { EntryDraft, LedgerEntry } from '@/domain/ledger/types'
import { createEntry } from '@/domain/ledger/validation'
import {
  createLedgerFile,
  fileErrorMessage,
  openLedgerFile,
  saveLedgerFile,
  supportsFileSystem,
  type FileSession,
} from '@/infrastructure/storage/file-system'

export interface LedgerWorkspace {
  id: string
  name: string
  session: FileSession | null
  entries: LedgerEntry[]
  dirty: boolean
  key: string
}

interface WorkspaceState {
  ledgers: LedgerWorkspace[]
  selectedLedgerId: string
}

const DEFAULT_LEDGER_NAME = '未命名账本'

function createWorkspace(): LedgerWorkspace {
  return {
    id: crypto.randomUUID(),
    name: DEFAULT_LEDGER_NAME,
    session: null,
    entries: [],
    dirty: false,
    key: crypto.randomUUID(),
  }
}

export function useLedger() {
  const [ledgers, setLedgers] = useState<LedgerWorkspace[]>(() => [createWorkspace()])
  const [selectedLedgerId, setSelectedLedgerId] = useState(() => ledgers[0]!.id)
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const state = useRef<WorkspaceState>({ ledgers, selectedLedgerId })
  const busy = useRef(false)

  function setWorkspace(next: WorkspaceState) {
    state.current = next
    setLedgers(next.ledgers)
    setSelectedLedgerId(next.selectedLedgerId)
  }

  function replaceLedger(ledgers: LedgerWorkspace[], next: LedgerWorkspace): LedgerWorkspace[] {
    return ledgers.map((ledger) => (ledger.id === next.id ? next : ledger))
  }

  function selectedLedger(): LedgerWorkspace | null {
    const current = state.current
    return current.ledgers.find((ledger) => ledger.id === current.selectedLedgerId) ?? null
  }

  function ledgerById(id: string): LedgerWorkspace | null {
    return state.current.ledgers.find((ledger) => ledger.id === id) ?? null
  }

  async function run(action: () => Promise<void>): Promise<boolean> {
    if (busy.current) return false
    busy.current = true
    setIsBusy(true)
    setError(null)
    try {
      await action()
      return true
    } catch (cause) {
      const message = fileErrorMessage(cause)
      if (cause instanceof DOMException && cause.name === 'AbortError') toast.info(message)
      else setError(message)
      return false
    } finally {
      busy.current = false
      setIsBusy(false)
    }
  }

  function open() {
    return run(async () => {
      const { entries, session } = await openLedgerFile()
      const ledger: LedgerWorkspace = {
        id: crypto.randomUUID(),
        name: session.handle.name,
        session,
        entries,
        dirty: false,
        key: crypto.randomUUID(),
      }
      setWorkspace({
        ledgers: [...state.current.ledgers, ledger],
        selectedLedgerId: ledger.id,
      })
      setSelectedEntryId(null)
      toast.success('账本已打开')
    })
  }

  function create() {
    return run(async () => {
      const ledger = createWorkspace()
      setWorkspace({
        ledgers: [...state.current.ledgers, ledger],
        selectedLedgerId: ledger.id,
      })
      setSelectedEntryId(null)
      toast.success('新账本已创建')
    })
  }

  function save(id?: string) {
    return run(async () => {
      const ledger = id ? ledgerById(id) : selectedLedger()
      if (!ledger) return
      const session = ledger.session
        ? await saveLedgerFile(ledger.session, ledger.entries)
        : await createLedgerFile(ledger.entries)
      const next: LedgerWorkspace = {
        ...ledger,
        name: ledger.session ? ledger.name : session.handle.name,
        session,
        dirty: false,
      }
      setWorkspace({
        ledgers: replaceLedger(state.current.ledgers, next),
        selectedLedgerId: state.current.selectedLedgerId,
      })
      toast.success('账本已保存')
    })
  }

  function saveAs(id?: string) {
    return run(async () => {
      const ledger = id ? ledgerById(id) : selectedLedger()
      if (!ledger) return
      const session = await createLedgerFile(ledger.entries)
      const next: LedgerWorkspace = {
        ...ledger,
        name: session.handle.name,
        session,
        dirty: false,
      }
      setWorkspace({
        ledgers: replaceLedger(state.current.ledgers, next),
        selectedLedgerId: state.current.selectedLedgerId,
      })
      toast.success('账本已保存到文件')
    })
  }

  function add(draft: EntryDraft, id?: string) {
    return run(async () => {
      const ledger = id ? ledgerById(id) : selectedLedger()
      if (!ledger) return
      const nextEntries = [...ledger.entries, createEntry(draft)]
      summarize(nextEntries)
      const session = ledger.session
        ? await saveLedgerFile(ledger.session, nextEntries)
        : await createLedgerFile(nextEntries)
      const next: LedgerWorkspace = {
        ...ledger,
        entries: nextEntries,
        name: ledger.session ? ledger.name : session.handle.name,
        session,
        dirty: false,
      }
      setWorkspace({
        ledgers: replaceLedger(state.current.ledgers, next),
        selectedLedgerId: state.current.selectedLedgerId,
      })
      toast.success('已保存这笔账目')
    })
  }

  function selectLedger(id: string) {
    if (state.current.selectedLedgerId === id) return
    state.current = { ...state.current, selectedLedgerId: id }
    setSelectedLedgerId(id)
    setSelectedEntryId(null)
  }

  function selectEntry(id: string | null) {
    setSelectedEntryId(id)
  }

  const selected = ledgers.find((ledger) => ledger.id === selectedLedgerId) ?? null
  const selectedEntry = selected?.entries.find((entry) => entry.id === selectedEntryId) ?? null

  return {
    ledgers,
    selectedLedgerId,
    selectedEntryId,
    selectedLedger: selected,
    selectedEntry,
    isBusy,
    error,
    fileSystemSupported: supportsFileSystem(),
    open,
    create,
    save,
    saveAs,
    add,
    selectLedger,
    selectEntry,
    clearError: () => setError(null),
  }
}

export type LedgerApi = ReturnType<typeof useLedger>

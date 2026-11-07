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

interface LedgerState {
  entries: LedgerEntry[]
  session: FileSession | null
  key: string
}

export function useLedger() {
  const [ledger, setLedger] = useState<LedgerState>(() => ({
    entries: [],
    session: null,
    key: 'new',
  }))
  const current = useRef(ledger)
  const busy = useRef(false)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function commit(next: LedgerState) {
    current.current = next
    setLedger(next)
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

  return {
    ...ledger,
    hasFile: ledger.session !== null,
    fileName: ledger.session?.handle.name ?? '我的账本',
    isBusy,
    error,
    fileSystemSupported: supportsFileSystem(),
    clearError: () => setError(null),
    open: () =>
      run(async () => {
        const { entries, session } = await openLedgerFile()
        commit({ entries, session, key: crypto.randomUUID() })
        toast.success('账本已打开')
      }),
    create: () =>
      run(async () => {
        const session = await createLedgerFile([])
        commit({ entries: [], session, key: crypto.randomUUID() })
        toast.success('新账本已创建')
      }),
    saveAs: () =>
      run(async () => {
        const session = await createLedgerFile(current.current.entries)
        commit({ ...current.current, session })
        toast.success('账本已保存到文件')
      }),
    add: (draft: EntryDraft) =>
      run(async () => {
        const next = [...current.current.entries, createEntry(draft)]
        summarize(next)
        const session = current.current.session
          ? await saveLedgerFile(current.current.session, next)
          : await createLedgerFile(next)
        commit({ ...current.current, entries: next, session })
        toast.success('已保存这笔账目')
      }),
  }
}

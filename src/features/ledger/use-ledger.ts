import { useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { supportsDirectoryPicker, supportsFileSystem } from '@/infrastructure/storage/file-system'
import { createWorkspaceController } from './workspace'

export function useLedger() {
  const [controller] = useState(() =>
    createWorkspaceController(undefined, (message) => toast.success(message)),
  )
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  const selectedLedger = state.ledgers.find((ledger) => ledger.id === state.selectedLedgerId)!
  return {
    ...controller,
    ...state,
    selectedLedger,
    selectedEntry:
      selectedLedger.entries.find((entry) => entry.id === state.selectedEntryId) ?? null,
    fileSystemSupported: supportsFileSystem(),
    directoryPickerSupported: supportsDirectoryPicker(),
  }
}
export type LedgerApi = ReturnType<typeof useLedger>

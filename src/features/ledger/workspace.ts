import type { CurrencyCode } from '@/domain/currency/currencies'
import type { EntryDraft, LedgerEntry } from '@/domain/ledger/types'
import { createEntry } from '@/domain/ledger/validation'
import {
  createLedgerFile,
  fileErrorMessage,
  openLedgerFiles,
  pickDefaultDirectory,
  sameFile,
  saveLedgerFile,
  type FileSession,
  type LedgerDirectoryHandle,
  type LedgerFileHandle,
} from '@/infrastructure/storage/file-system'

export interface LedgerWorkspace {
  id: string
  name: string
  session: FileSession | null
  entries: LedgerEntry[]
}
export interface WorkspaceState {
  ledgers: LedgerWorkspace[]
  selectedLedgerId: string
  selectedEntryId: string | null
  defaultDirectory: LedgerDirectoryHandle | null
  isBusy: boolean
  error: string | null
}
interface Storage {
  open: typeof openLedgerFiles
  create: typeof createLedgerFile
  save: typeof saveLedgerFile
  pickDirectory?: typeof pickDefaultDirectory
}
function emptyLedger(): LedgerWorkspace {
  return { id: crypto.randomUUID(), name: '未命名账本', session: null, entries: [] }
}

// Async operations capture one target ledger and publish only after the file closes.
export function createWorkspaceController(
  storage: Storage = {
    open: openLedgerFiles,
    create: createLedgerFile,
    save: saveLedgerFile,
    pickDirectory: pickDefaultDirectory,
  },
  notify: (message: string) => void = () => {},
) {
  const initial = emptyLedger()
  let state: WorkspaceState = {
    ledgers: [initial],
    selectedLedgerId: initial.id,
    selectedEntryId: null,
    defaultDirectory: null,
    isBusy: false,
    error: null,
  }
  const listeners = new Set<() => void>()
  function update(patch: Partial<WorkspaceState>) {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  }
  function getLedger(id = state.selectedLedgerId) {
    const ledger = state.ledgers.find((item) => item.id === id)
    if (!ledger) throw new Error('账本已关闭，请重新选择。')
    return ledger
  }
  async function run(action: () => Promise<void>) {
    if (state.isBusy) return false
    update({ isBusy: true, error: null })
    try {
      await action()
      return true
    } catch (cause) {
      if (!(cause instanceof DOMException && cause.name === 'AbortError'))
        update({ error: fileErrorMessage(cause) })
      return false
    } finally {
      update({ isBusy: false })
    }
  }
  async function checkTarget(ledger: LedgerWorkspace, handle: LedgerFileHandle) {
    for (const other of state.ledgers) {
      if (!other.session || !(await sameFile(other.session.handle, handle))) continue
      if (other.id !== ledger.id) throw new Error('该文件已在其他账本中打开，请选择其他文件。')
      if ((await (await handle.getFile()).text()) !== other.session.snapshot)
        throw new Error('账本已在其他窗口修改，请重新打开后再保存。')
    }
  }
  async function persist(ledger: LedgerWorkspace, entries: LedgerEntry[], saveAs = false) {
    const session =
      ledger.session && !saveAs
        ? await storage.save(ledger.session, entries)
        : await storage.create(
            entries,
            (handle) => checkTarget(ledger, handle),
            state.defaultDirectory,
          )
    update({
      ledgers: state.ledgers.map((item) =>
        item.id === ledger.id ? { ...ledger, entries, session, name: session.handle.name } : item,
      ),
    })
  }
  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    clearError: () => update({ error: null }),
    setDefaultDirectory: (directory: LedgerDirectoryHandle | null) =>
      update({ defaultDirectory: directory }),
    async chooseDefaultDirectory() {
      if (!storage.pickDirectory) {
        update({ error: '当前浏览器不支持选择默认保存目录。' })
        return null
      }
      let directory: LedgerDirectoryHandle | null = null
      const ok = await run(async () => {
        directory = await storage.pickDirectory!()
      })
      return ok ? directory : null
    },
    open: () =>
      run(async () => {
        const opened = await storage.open()
        // Prepare the complete batch before replacing any workspace state.
        const next = [...state.ledgers]
        let selectedId = state.selectedLedgerId
        for (const { entries, session } of opened) {
          let existing: LedgerWorkspace | undefined
          for (const item of next) {
            if (item.session && (await sameFile(item.session.handle, session.handle))) {
              existing = item
              break
            }
          }
          const ledger = {
            id: existing?.id ?? crypto.randomUUID(),
            name: session.handle.name,
            entries,
            session,
          }
          if (existing) next[next.indexOf(existing)] = ledger
          else next.push(ledger)
          selectedId = ledger.id
        }
        update({ ledgers: next, selectedLedgerId: selectedId, selectedEntryId: null })
        notify('账本已打开')
      }),
    create: () =>
      run(async () => {
        const ledger = emptyLedger()
        update({
          ledgers: [...state.ledgers, ledger],
          selectedLedgerId: ledger.id,
          selectedEntryId: null,
        })
        notify('新账本已创建')
      }),
    save: (id?: string) =>
      run(async () => {
        const ledger = getLedger(id)
        await persist(ledger, ledger.entries)
        notify('账本已保存')
      }),
    saveAs: (id?: string) =>
      run(async () => {
        const ledger = getLedger(id)
        await persist(ledger, ledger.entries, true)
        notify('账本已另存为')
      }),
    add: (draft: EntryDraft, currency: CurrencyCode, id?: string) =>
      run(async () => {
        const ledger = getLedger(id)
        await persist(ledger, [...ledger.entries, createEntry(draft, currency)])
        notify('已保存这笔账目')
      }),
    selectLedger(id: string) {
      if (state.isBusy || !state.ledgers.some((item) => item.id === id)) return
      if (state.selectedLedgerId !== id) update({ selectedLedgerId: id, selectedEntryId: null })
    },
    selectEntry(ledgerId: string, entryId: string) {
      if (
        state.isBusy ||
        !state.ledgers.some(
          (item) => item.id === ledgerId && item.entries.some((entry) => entry.id === entryId),
        )
      )
        return
      update({ selectedLedgerId: ledgerId, selectedEntryId: entryId })
    },
    remove(id: string) {
      if (state.isBusy) return
      const index = state.ledgers.findIndex((item) => item.id === id)
      if (index < 0) return
      const next = state.ledgers.filter((item) => item.id !== id)
      if (!next.length) next.push(emptyLedger())
      update({
        ledgers: next,
        ...(state.selectedLedgerId === id
          ? { selectedLedgerId: next[Math.min(index, next.length - 1)]!.id, selectedEntryId: null }
          : {}),
      })
    },
  }
}

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { summarize } from '@/domain/ledger/selectors'
import type { EntryDraft, LedgerEntry } from '@/domain/ledger/types'
import { createEntry } from '@/domain/ledger/validation'
import {
  createLedgerFile,
  fileErrorMessage,
  openLedgerFile,
  openLedgerFiles,
  saveLedgerFile,
  supportsFileSystem,
  type FileSession,
} from '@/infrastructure/storage/file-system'

/** 单个账本 */
export interface LedgerItem {
  id: string
  name: string
  entries: LedgerEntry[]
  session: FileSession | null
  key: string
}

/** 多账本工作区 */
interface WorkspaceState {
  ledgers: LedgerItem[]
  activeLedgerId: string | null
}

function createLedgerItem(entries: LedgerEntry[], session: FileSession | null): LedgerItem {
  return {
    id: crypto.randomUUID(),
    name: session?.handle.name ?? '未命名账本',
    entries,
    session,
    key: crypto.randomUUID(),
  }
}

export function useLedger() {
  const [workspace, setWorkspace] = useState<WorkspaceState>({
    ledgers: [],
    activeLedgerId: null,
  })

  const current = useRef(workspace)
  const busy = useRef(false)

  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function commit(next: WorkspaceState) {
    current.current = next
    setWorkspace(next)
  }

  function updateLedger(id: string, update: Partial<LedgerItem>) {
    const next: WorkspaceState = {
      ...current.current,
      ledgers: current.current.ledgers.map((ledger) =>
        ledger.id === id ? { ...ledger, ...update } : ledger,
      ),
    }

    commit(next)
  }

  function addToWorkspace(item: LedgerItem) {
    const next: WorkspaceState = {
      ledgers: [...current.current.ledgers, item],
      activeLedgerId: item.id,
    }

    commit(next)
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

      if (cause instanceof DOMException && cause.name === 'AbortError') {
        toast.info(message)
      } else {
        setError(message)
      }

      return false
    } finally {
      busy.current = false
      setIsBusy(false)
    }
  }

  const activeLedger = workspace.ledgers.find((ledger) => ledger.id === workspace.activeLedgerId)

  const entries = activeLedger?.entries ?? []

  return {
    // 多账本状态
    ledgers: workspace.ledgers,
    activeLedgerId: workspace.activeLedgerId,
    activeLedger,

    // 兼容原有组件
    entries,
    session: activeLedger?.session ?? null,
    key: activeLedger?.key ?? 'empty',
    hasFile: activeLedger?.session !== null && activeLedger !== undefined,
    fileName: activeLedger?.name ?? '我的账本',

    // 操作状态
    isBusy,
    error,
    fileSystemSupported: supportsFileSystem(),

    clearError: () => setError(null),

    /** 切换当前账本 */
    switchLedger: (id: string) => {
      if (!current.current.ledgers.some((ledger) => ledger.id === id)) {
        return
      }

      commit({
        ...current.current,
        activeLedgerId: id,
      })
    },

    /** 打开单个账本 */
    open: () =>
      run(async () => {
        const { entries, session } = await openLedgerFile()
        const item = createLedgerItem(entries, session)

        addToWorkspace(item)
        toast.success('账本已打开')
      }),

    /** 一次打开多个账本 */
    openMany: () =>
      run(async () => {
        const results = await openLedgerFiles()

        const items = results.map(({ entries, session }) => createLedgerItem(entries, session))

        commit({
          ledgers: [...current.current.ledgers, ...items],
          activeLedgerId: items[0]?.id ?? current.current.activeLedgerId,
        })

        toast.success(`已打开 ${items.length} 个账本`)
      }),

    /** 新建账本 */
    create: () =>
      run(async () => {
        const session = await createLedgerFile([])
        const item = createLedgerItem([], session)

        addToWorkspace(item)
        toast.success('新账本已创建')
      }),

    /** 保存指定账本 */
    saveLedger: (id?: string) =>
      run(async () => {
        const targetId = id ?? current.current.activeLedgerId
        const target = current.current.ledgers.find((ledger) => ledger.id === targetId)

        if (!target) throw new Error('请先选择一个账本。')
        if (!target.session) throw new Error('该账本尚未关联文件，请使用另存为。')

        const session = await saveLedgerFile(target.session, target.entries)

        updateLedger(target.id, { session })
        toast.success('账本已保存')
      }),

    /** 另存为 */
    saveAs: (id?: string) =>
      run(async () => {
        const targetId = id ?? current.current.activeLedgerId
        const target = current.current.ledgers.find((ledger) => ledger.id === targetId)

        if (!target) throw new Error('请先选择一个账本。')

        const session = await createLedgerFile(target.entries)

        updateLedger(target.id, {
          session,
          name: session.handle.name,
        })

        toast.success('账本已另存为')
      }),

    /** 从工作区移除账本，不删除磁盘文件 */
    removeLedger: (id: string) => {
      const state = current.current
      const index = state.ledgers.findIndex((ledger) => ledger.id === id)

      if (index === -1) return

      const ledgers = state.ledgers.filter((ledger) => ledger.id !== id)

      let activeLedgerId = state.activeLedgerId

      if (activeLedgerId === id) {
        activeLedgerId = ledgers[Math.min(index, ledgers.length - 1)]?.id ?? null
      }

      commit({ ledgers, activeLedgerId })
      toast.success('已从工作区移除账本')
    },

    /** 向当前账本添加账目 */
    add: (draft: EntryDraft) =>
      run(async () => {
        const target = current.current.ledgers.find(
          (ledger) => ledger.id === current.current.activeLedgerId,
        )

        if (!target) throw new Error('请先新建或打开一个账本。')

        const next = [...target.entries, createEntry(draft)]

        summarize(next)

        const session = target.session
          ? await saveLedgerFile(target.session, next)
          : await createLedgerFile(next)

        updateLedger(target.id, {
          entries: next,
          session,
          name: session.handle.name,
        })

        toast.success('已保存这笔账目')
      }),
  }
}

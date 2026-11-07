import { afterEach, describe, expect, it, vi } from 'vitest'
import type { EntryDraft } from '@/domain/ledger/types'
import { createEntry } from '@/domain/ledger/validation'
import { parseJsonl, serializeJsonl } from '@/infrastructure/storage/jsonl'
import type { LedgerFileHandle } from '@/infrastructure/storage/file-system'
import { createWorkspaceController } from './workspace'

const draft: EntryDraft = {
  type: 'expense',
  date: '2026-11-07',
  amount: '10',
  category: '咖啡',
  note: '原币种',
}
function file(name = '账本.jsonl', initial = '', failClose = false) {
  let content = initial
  let pending = ''
  const handle: LedgerFileHandle = {
    name,
    getFile: async () => ({ text: async () => content }),
    createWritable: vi.fn(async () => ({
      write: async (text: string) => {
        pending = text
      },
      close: async () => {
        if (failClose) throw new Error('磁盘已满')
        content = pending
      },
      abort: vi.fn(async () => {
        pending = ''
      }),
    })),
  }
  return {
    handle,
    read: () => content,
    change: (text: string) => {
      content = text
    },
  }
}
afterEach(() => vi.unstubAllGlobals())
function setup(open: LedgerFileHandle[] = [], save = file().handle) {
  const picker = vi.fn(async () => open)
  vi.stubGlobal('window', {
    showOpenFilePicker: picker,
    showSaveFilePicker: vi.fn(async () => save),
  })
  const notify = vi.fn()
  const controller = createWorkspaceController(undefined, notify)
  return { controller, picker, notify }
}

describe('多账本与文件提交', () => {
  it('首笔直接保存所选币种，重开和切换展示不会改变原币金额', async () => {
    const target = file()
    const { controller } = setup([], target.handle)
    expect(await controller.add(draft, 'USD')).toBe(true)
    const saved = parseJsonl(target.read())
    expect(saved[0]).toMatchObject({ currency: 'USD', amountCents: 1000, category: '咖啡' })
    expect(controller.getSnapshot().ledgers[0]!.entries).toEqual(saved)
  })
  it('切换跨账本同 ID 账目时同时更新账本和明细', async () => {
    const a = createEntry(draft, 'CNY')
    const b = { ...a, currency: 'USD' as const, note: '第二本' }
    const { controller } = setup([
      file('同名.jsonl', serializeJsonl([a])).handle,
      file('同名.jsonl', serializeJsonl([b])).handle,
    ])
    await controller.open()
    const [, first, second] = controller.getSnapshot().ledgers
    controller.selectEntry(first!.id, a.id)
    expect(controller.getSnapshot()).toMatchObject({
      selectedLedgerId: first!.id,
      selectedEntryId: a.id,
    })
    controller.selectEntry(second!.id, b.id)
    expect(controller.getSnapshot()).toMatchObject({
      selectedLedgerId: second!.id,
      selectedEntryId: b.id,
    })
    expect(controller.getSnapshot().ledgers).toHaveLength(3)
    controller.selectEntry('missing', b.id)
    expect(controller.getSnapshot().selectedLedgerId).toBe(second!.id)
  })
  it('同一文件再次打开刷新快照并去重，批量任一文件坏行时整个批次不加载', async () => {
    const good = file('好.jsonl')
    const { controller, picker } = setup([good.handle])
    await controller.open()
    const id = controller.getSnapshot().selectedLedgerId
    const alias = { ...good.handle, isSameEntry: async () => true }
    good.handle.isSameEntry = async (other) => other === alias
    picker.mockResolvedValue([alias])
    await controller.open()
    expect(controller.getSnapshot().selectedLedgerId).toBe(id)
    expect(controller.getSnapshot().ledgers).toHaveLength(2)
    const before = controller.getSnapshot().ledgers
    picker.mockResolvedValue([file('第二个.jsonl').handle, file('坏.jsonl', '{broken}').handle])
    expect(await controller.open()).toBe(false)
    expect(controller.getSnapshot().ledgers).toBe(before)
    expect(controller.getSnapshot().error).toContain('坏.jsonl：第 1 行')
  })
  it('close 失败时不发布候选账目、不显示成功，保留原账本与可重试草稿', async () => {
    const target = file('失败.jsonl', '', true)
    const { controller, notify } = setup([target.handle])
    await controller.open()
    notify.mockClear()
    const before = controller.getSnapshot().ledgers
    expect(await controller.add(draft, 'GBP')).toBe(false)
    expect(controller.getSnapshot().ledgers).toBe(before)
    expect(controller.getSnapshot().error).toBe('磁盘已满')
    expect(target.read()).toBe('')
    expect(draft.amount).toBe('10')
    expect(notify).not.toHaveBeenCalled()
  })
  it('写入串行，忙碌时不切账本、不关闭账本，close 完成前不提交状态', async () => {
    const target = file()
    let finish!: () => void
    target.handle.createWritable = vi.fn(async () => ({
      write: async () => {},
      close: () =>
        new Promise<void>((resolve) => {
          finish = resolve
        }),
      abort: async () => {},
    }))
    const { controller } = setup([target.handle])
    await controller.open()
    const before = controller.getSnapshot().ledgers
    const id = controller.getSnapshot().selectedLedgerId
    const saving = controller.add(draft, 'EUR')
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'))
    expect(controller.getSnapshot().ledgers).toBe(before)
    expect(await controller.save()).toBe(false)
    controller.selectLedger(before[0]!.id)
    controller.remove(id)
    expect(controller.getSnapshot().selectedLedgerId).toBe(id)
    finish()
    expect(await saving).toBe(true)
    expect(controller.getSnapshot().ledgers.at(-1)!.entries[0]!.currency).toBe('EUR')
    expect(target.handle.createWritable).toHaveBeenCalledTimes(1)
  })
  it('保存失败和外部改动保留快照，取消操作不报错，关闭最后一本回到空工作台', async () => {
    const target = file()
    const { controller, picker } = setup([target.handle])
    await controller.open()
    const before = controller.getSnapshot().ledgers
    target.change('外部修改')
    expect(await controller.add(draft, 'USD')).toBe(false)
    expect(controller.getSnapshot().error).toContain('重新打开')
    expect(controller.getSnapshot().ledgers).toBe(before)
    picker.mockRejectedValue(new DOMException('cancel', 'AbortError'))
    expect(await controller.open()).toBe(false)
    expect(controller.getSnapshot().error).toBeNull()
    expect(controller.getSnapshot().ledgers).toBe(before)
    for (const ledger of before) controller.remove(ledger.id)
    expect(controller.getSnapshot().ledgers).toHaveLength(1)
    expect(controller.getSnapshot().ledgers[0]).toMatchObject({ session: null, entries: [] })
  })
  it('另存为不能覆盖另一个已打开的账本，已有自身文件仍检查外部改动', async () => {
    const a = file('a.jsonl')
    const b = file('b.jsonl')
    const { controller } = setup([a.handle, b.handle], a.handle)
    await controller.open()
    expect(await controller.saveAs()).toBe(false)
    expect(controller.getSnapshot().error).toContain('其他账本')
    expect(a.handle.createWritable).not.toHaveBeenCalled()
    const first = controller.getSnapshot().ledgers[1]!
    controller.selectLedger(first.id)
    a.change('外部修改')
    expect(await controller.saveAs()).toBe(false)
    expect(controller.getSnapshot().error).toContain('重新打开')
    expect(a.handle.createWritable).not.toHaveBeenCalled()
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LedgerEntry } from '@/domain/ledger/types'
import {
  fileErrorMessage,
  openLedgerFile,
  saveLedgerFile,
  supportsFileSystem,
  type LedgerFileHandle,
} from '@/infrastructure/storage/file-system'
import { parseJsonl, serializeJsonl } from '@/infrastructure/storage/jsonl'

const entry: LedgerEntry = {
  id: 'robust-1',
  type: 'expense',
  date: '2026-11-07',
  amountCents: 2550,
  category: '饮食',
  note: '午餐\n咖啡',
  createdAt: '2026-11-07T14:00:00+08:00',
  currency: 'CNY',
}

afterEach(() => vi.unstubAllGlobals())

describe('文件能力与错误提示', () => {
  it('仅在安全上下文且同时支持打开和保存选择器时启用文件功能', () => {
    vi.stubGlobal('window', {
      isSecureContext: true,
      showOpenFilePicker: () => undefined,
      showSaveFilePicker: () => undefined,
    })
    expect(supportsFileSystem()).toBe(true)

    vi.stubGlobal('window', {
      isSecureContext: false,
      showOpenFilePicker: () => undefined,
      showSaveFilePicker: () => undefined,
    })
    expect(supportsFileSystem()).toBe(false)

    vi.stubGlobal('window', { isSecureContext: true, showOpenFilePicker: () => undefined })
    expect(supportsFileSystem()).toBe(false)
  })

  it('缺少选择器时提示使用桌面版 Chrome 或 Edge', async () => {
    vi.stubGlobal('window', { isSecureContext: true })
    await expect(openLedgerFile()).rejects.toThrow('Chrome 或 Edge')
  })

  it('将浏览器异常映射为可操作的中文提示', () => {
    expect(fileErrorMessage(new DOMException('x', 'AbortError'))).toBe('已取消文件操作。')
    expect(fileErrorMessage(new DOMException('x', 'NotAllowedError'))).toContain('允许浏览器')
    expect(fileErrorMessage(new DOMException('x', 'SecurityError'))).toContain('允许浏览器')
    expect(fileErrorMessage(new DOMException('x', 'NotFoundError'))).toContain('重新选择')
    expect(fileErrorMessage(new DOMException('x', 'NoModificationAllowedError'))).toContain(
      '被占用',
    )
    expect(fileErrorMessage(new Error('自定义错误'))).toBe('自定义错误')
    expect(fileErrorMessage('未知错误')).toBe('文件操作失败，请重试。')
  })
})

describe('写入异常与快照保护', () => {
  function fakeFile(initial: string, failAt: 'write' | 'close' | null = null) {
    let contents = initial
    let pending = ''
    const abort = vi.fn(async () => {
      pending = ''
    })
    const handle: LedgerFileHandle = {
      name: '账本.jsonl',
      getFile: async () => ({ text: async () => contents }),
      createWritable: vi.fn(async () => ({
        write: async (text: string) => {
          if (failAt === 'write') throw new Error('磁盘已满')
          pending = text
        },
        close: async () => {
          if (failAt === 'close') throw new Error('关闭失败')
          contents = pending
        },
        abort,
      })),
    }
    return { handle, abort, contents: () => contents }
  }

  it('写入阶段失败时保留原文件并清理写入流', async () => {
    const file = fakeFile(serializeJsonl([entry]), 'write')
    const session = { handle: file.handle, snapshot: serializeJsonl([entry]) }
    await expect(saveLedgerFile(session, [])).rejects.toThrow('磁盘已满')
    expect(file.contents()).toBe(serializeJsonl([entry]))
    expect(file.abort).toHaveBeenCalledOnce()
  })

  it('快照不一致时拒绝覆盖外部修改', async () => {
    const file = fakeFile(serializeJsonl([entry]))
    await expect(saveLedgerFile({ handle: file.handle, snapshot: '' }, [])).rejects.toThrow(
      '其他窗口修改',
    )
    expect(file.handle.createWritable).not.toHaveBeenCalled()
    expect(parseJsonl(file.contents())).toEqual([entry])
  })

  it('读取阶段拒绝合计超出安全整数的账本', () => {
    const line = JSON.stringify({
      ...entry,
      type: 'income',
      category: '工资',
      amountCents: Number.MAX_SAFE_INTEGER,
    })
    expect(() => parseJsonl(`${line}\n${line.replace('robust-1', 'robust-2')}\n`)).toThrow(
      '拆分账本',
    )
  })
})

import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LedgerEntry } from '@/domain/ledger/types'
import {
  createLedgerFile,
  openLedgerFile,
  saveLedgerFile,
  fileErrorMessage,
  pickDefaultDirectory,
  supportsDirectoryPicker,
  type LedgerFileHandle,
} from './file-system'
import { parseJsonl, serializeJsonl } from './jsonl'

const entry: LedgerEntry = {
  id: '1',
  type: 'expense',
  date: '2026-11-07',
  amountCents: 2550,
  category: '饮食',
  note: '午餐\n咖啡',
  createdAt: '2026-11-07T14:00:00+08:00',
  currency: 'CNY',
}

describe('JSONL 格式', () => {
  it('中文与备注换行保持在同一 JSON 行，支持 LF 和 CRLF', () => {
    const text = serializeJsonl([entry])
    expect(text.split('\n')).toHaveLength(2)
    expect(parseJsonl(text)).toEqual([entry])
    expect(parseJsonl(text.replace(/\n/g, '\r\n'))).toEqual([entry])
    expect(parseJsonl('')).toEqual([])
    expect(serializeJsonl([])).toBe('')
  })
  it('报告损坏行、重复标识和业务字段错误', () => {
    expect(() => parseJsonl(`${JSON.stringify(entry)}\n{broken}\n`)).toThrow('第 2 行')
    expect(() => parseJsonl(`${JSON.stringify(entry)}\n\n`)).toThrow('第 2 行')
    expect(() => serializeJsonl([entry, entry])).toThrow('重复')
    expect(() => parseJsonl(JSON.stringify({ ...entry, amountCents: 25.5 }))).toThrow('安全整数')
    expect(() => parseJsonl(JSON.stringify({ ...entry, category: ' ' }))).toThrow('类别')
    expect(parseJsonl(JSON.stringify({ ...entry, category: '咖啡' }))[0]?.category).toBe('咖啡')
  })
})

describe('文件保存', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('默认目录只请求读取权限用于保存位置，非安全上下文不提供入口', async () => {
    const directory = { name: '账本目录' }
    const showDirectoryPicker = vi.fn(async () => directory)
    vi.stubGlobal('window', { isSecureContext: true, showDirectoryPicker })
    expect(supportsDirectoryPicker()).toBe(true)
    expect(await pickDefaultDirectory()).toBe(directory)
    expect(showDirectoryPicker).toHaveBeenCalledWith({ mode: 'read' })
    vi.stubGlobal('window', { isSecureContext: false, showDirectoryPicker })
    expect(supportsDirectoryPicker()).toBe(false)
  })

  function fakeFile(initial: string, failClose = false) {
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
          pending = text
        },
        close: async () => {
          if (failClose) throw new Error('磁盘写入失败')
          contents = pending
        },
        abort,
      })),
    }
    return { handle, abort, contents: () => contents }
  }

  it('关闭写入流后提交新内容和快照', async () => {
    const file = fakeFile('')
    const next = await saveLedgerFile({ handle: file.handle, snapshot: '' }, [entry])
    expect(parseJsonl(file.contents())).toEqual([entry])
    expect(next.snapshot).toBe(file.contents())
  })
  it('写入失败保留原文件与原会话', async () => {
    const file = fakeFile('', true)
    const original = { handle: file.handle, snapshot: '' }
    await expect(saveLedgerFile(original, [entry])).rejects.toThrow('磁盘写入失败')
    expect(file.contents()).toBe('')
    expect(original.snapshot).toBe('')
    expect(file.abort).toHaveBeenCalledOnce()
  })
  it('发现外部修改时阻止覆盖', async () => {
    const file = fakeFile(serializeJsonl([entry]))
    await expect(saveLedgerFile({ handle: file.handle, snapshot: '' }, [])).rejects.toThrow(
      '其他窗口修改',
    )
    expect(file.handle.createWritable).not.toHaveBeenCalled()
    expect(parseJsonl(file.contents())).toEqual([entry])
  })

  it('首次保存创建文件，空账本与第一笔记录均可写入', async () => {
    const file = fakeFile('')
    const showSaveFilePicker = vi.fn(async () => file.handle)
    vi.stubGlobal('window', { showSaveFilePicker })
    const empty = await createLedgerFile([])
    expect(empty.snapshot).toBe('')
    const first = await saveLedgerFile(empty, [entry])
    expect(parseJsonl(first.snapshot)).toEqual([entry])
    expect(showSaveFilePicker).toHaveBeenCalledOnce()
  })

  it('打开账本时校验完整文件并保存快照', async () => {
    const file = fakeFile(serializeJsonl([entry]))
    vi.stubGlobal('window', { showOpenFilePicker: async () => [file.handle] })
    const opened = await openLedgerFile()
    expect(opened.entries).toEqual([entry])
    expect(opened.session.snapshot).toBe(file.contents())
  })

  it('拒绝载入损坏账本', async () => {
    const file = fakeFile(`${JSON.stringify(entry)}\ninvalid\n`)
    vi.stubGlobal('window', { showOpenFilePicker: async () => [file.handle] })
    await expect(openLedgerFile()).rejects.toThrow('第 2 行')
    expect(file.handle.createWritable).not.toHaveBeenCalled()
  })

  it('取消文件选择时保持数据，授权错误返回可操作提示', async () => {
    const file = fakeFile('')
    vi.stubGlobal('window', {
      showSaveFilePicker: async () => {
        throw new DOMException('cancel', 'AbortError')
      },
    })
    await expect(createLedgerFile([entry])).rejects.toMatchObject({ name: 'AbortError' })
    expect(file.contents()).toBe('')
    expect(fileErrorMessage(new DOMException('denied', 'NotAllowedError'))).toContain('允许浏览器')
  })
})

import type { LedgerEntry } from '@/domain/ledger/types'
import { parseJsonl, serializeJsonl } from './jsonl'

export interface LedgerWritable {
  write(data: string): Promise<void>
  close(): Promise<void>
  abort(): Promise<void>
}

export interface LedgerFileHandle {
  name: string
  getFile(): Promise<{ text(): Promise<string> }>
  createWritable(options?: { mode: 'exclusive' }): Promise<LedgerWritable>
}

export interface FileSession {
  handle: LedgerFileHandle
  snapshot: string
}

interface PickerOptions {
  types: { description: string; accept: Record<string, string[]> }[]
  excludeAcceptAllOption: boolean
  suggestedName?: string
  multiple?: boolean
}

interface FilePickerApi {
  showOpenFilePicker?(options: PickerOptions): Promise<LedgerFileHandle[]>
  showSaveFilePicker?(options: PickerOptions): Promise<LedgerFileHandle>
}

const pickerOptions: PickerOptions = {
  types: [{ description: 'JSONL 账本', accept: { 'application/json': ['.jsonl'] } }],
  excludeAcceptAllOption: true,
}

function pickers(): FilePickerApi {
  return window as Window & FilePickerApi
}

export function supportsFileSystem(): boolean {
  return (
    window.isSecureContext &&
    typeof pickers().showOpenFilePicker === 'function' &&
    typeof pickers().showSaveFilePicker === 'function'
  )
}

export async function openLedgerFile() {
  const open = pickers().showOpenFilePicker
  if (!open) throw new Error('请使用桌面版 Chrome 或 Edge 打开账本。')
  const [handle] = await open.call(window, { ...pickerOptions, multiple: false })
  if (!handle) throw new DOMException('操作已取消', 'AbortError')
  const snapshot = await (await handle.getFile()).text()
  return { entries: parseJsonl(snapshot), session: { handle, snapshot } }
}

/*一次打开多个账本文件*/
export async function openLedgerFiles() {
  const open = pickers().showOpenFilePicker

  if (!open) {
    throw new Error('请使用桌面版 Chrome 或 Edge 打开账本。')
  }

  const handles = await open.call(window, {
    ...pickerOptions,
    multiple: true,
  })

  if (!handles.length) {
    throw new DOMException('操作已取消', 'AbortError')
  }

  const results = await Promise.all(
    handles.map(async (handle) => {
      const snapshot = await (await handle.getFile()).text()

      return {
        entries: parseJsonl(snapshot),
        session: {
          handle,
          snapshot,
        },
      }
    }),
  )

  return results
}

async function writeFile(handle: LedgerFileHandle, content: string): Promise<void> {
  const stream = await handle.createWritable({ mode: 'exclusive' })
  try {
    await stream.write(content)
    await stream.close()
  } catch (error) {
    await stream.abort().catch(() => undefined)
    throw error
  }
}

export async function createLedgerFile(entries: readonly LedgerEntry[]): Promise<FileSession> {
  const save = pickers().showSaveFilePicker
  if (!save) throw new Error('请使用桌面版 Chrome 或 Edge 保存账本。')
  const handle = await save.call(window, { ...pickerOptions, suggestedName: '我的账本.jsonl' })
  const snapshot = serializeJsonl(entries)
  await writeFile(handle, snapshot)
  return { handle, snapshot }
}

export async function saveLedgerFile(
  session: FileSession,
  entries: readonly LedgerEntry[],
): Promise<FileSession> {
  const current = await (await session.handle.getFile()).text()
  if (current !== session.snapshot) throw new Error('账本已在其他窗口修改，请重新打开后再保存。')
  const snapshot = serializeJsonl(entries)
  await writeFile(session.handle, snapshot)
  return { handle: session.handle, snapshot }
}

export function fileErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') return '已取消文件操作。'
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      return '请允许浏览器读写所选文件，然后重试。'
    if (error.name === 'NotFoundError') return '账本文件已移动，请重新选择文件。'
    if (error.name === 'NoModificationAllowedError') return '账本正在被占用，请稍后重试。'
  }
  return error instanceof Error ? error.message : '文件操作失败，请重试。'
}

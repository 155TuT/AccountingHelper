import { summarize } from '@/domain/ledger/selectors'
import type { LedgerEntry } from '@/domain/ledger/types'
import { validateEntry } from '@/domain/ledger/validation'

export function parseJsonl(text: string): LedgerEntry[] {
  if (text === '') return []
  const lines = text.split(/\r?\n/)
  if (lines.at(-1) === '') lines.pop()
  const ids = new Set<string>()
  const entries = lines.map((line, index) => {
    try {
      if (!line.trim()) throw new Error('账目行为空。')
      const entry = validateEntry(JSON.parse(line))
      if (ids.has(entry.id)) throw new Error(`账目标识 ${entry.id} 重复。`)
      ids.add(entry.id)
      return entry
    } catch (error) {
      const reason =
        error instanceof SyntaxError
          ? 'JSON 格式错误。'
          : error instanceof Error
            ? error.message
            : '记录格式错误。'
      throw new Error(`第 ${index + 1} 行：${reason}`)
    }
  })
  summarize(entries)
  return entries
}

export function serializeJsonl(entries: readonly LedgerEntry[]): string {
  const text = entries.map((entry) => JSON.stringify(entry)).join('\n')
  const result = text ? `${text}\n` : ''
  parseJsonl(result)
  return result
}

import { DEFAULT_CURRENCY, isCurrencyCode, type CurrencyCode } from '@/domain/currency/currencies'
import { parseMoney } from './money'
import type { EntryDraft, LedgerEntry } from './types'

export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function isValidDate(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function validateEntry(value: unknown): LedgerEntry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('每行应为一个账目对象。')
  }
  const item = value as Record<string, unknown>
  const fields = ['id', 'type', 'date', 'amountCents', 'category', 'note', 'createdAt', 'currency']
  if (Object.keys(item).some((key) => !fields.includes(key))) {
    throw new Error('账目包含当前版本无法识别的字段。')
  }
  if (typeof item.id !== 'string' || !item.id.trim()) throw new Error('账目标识为空。')
  if (item.type !== 'income' && item.type !== 'expense') throw new Error('收支类型无效。')
  if (typeof item.date !== 'string' || !isValidDate(item.date)) throw new Error('日期无效。')
  if (
    typeof item.amountCents !== 'number' ||
    !Number.isSafeInteger(item.amountCents) ||
    item.amountCents <= 0
  ) {
    throw new Error('金额应为大于 0 的安全整数，单位为分。')
  }
  if (typeof item.category !== 'string' || !item.category.trim()) {
    throw new Error('类别不能为空。')
  }
  if (typeof item.note !== 'string') throw new Error('备注应为文字，可留空。')
  if (
    typeof item.createdAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(item.createdAt) ||
    !isValidDate(item.createdAt.slice(0, 10)) ||
    !Number.isFinite(Date.parse(item.createdAt))
  ) {
    throw new Error('录入时间应为带时区的 ISO 8601 时间。')
  }
  const currency = item.currency === undefined ? DEFAULT_CURRENCY : item.currency
  if (!isCurrencyCode(currency)) throw new Error('币种应为受支持的币种标识。')
  return { ...item, currency } as unknown as LedgerEntry
}

export function createEntry(
  draft: EntryDraft,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): LedgerEntry {
  return validateEntry({
    id: crypto.randomUUID(),
    type: draft.type,
    date: draft.date,
    amountCents: parseMoney(draft.amount),
    category: draft.category.trim(),
    note: draft.note.trim(),
    createdAt: new Date().toISOString(),
    currency,
  })
}

import { ALL_CATEGORIES } from './constants'
import { parseMoney } from './money'
import type { EntryType, LedgerEntry, LedgerFilters, LedgerTotals } from './types'
import { isValidDate } from './validation'

export function summarize(entries: readonly LedgerEntry[]): LedgerTotals {
  let income = 0
  let expense = 0
  for (const entry of entries) {
    if (entry.type === 'income') income += entry.amountCents
    else expense += entry.amountCents
    if (!Number.isSafeInteger(income) || !Number.isSafeInteger(expense)) {
      throw new Error('账本合计超过精确计算范围，请拆分账本。')
    }
  }
  return { income, expense, balance: income - expense }
}

export function validateFilters(filters: LedgerFilters): void {
  if (
    (filters.startDate && !isValidDate(filters.startDate)) ||
    (filters.endDate && !isValidDate(filters.endDate))
  )
    throw new Error('请选择有效日期。')
  if (filters.startDate && filters.endDate && filters.startDate > filters.endDate)
    throw new Error('开始日期应早于或等于结束日期。')
  if (filters.category && !ALL_CATEGORIES.includes(filters.category))
    throw new Error('请选择有效类别。')
  const min = filters.minAmount.trim() ? parseMoney(filters.minAmount, true) : undefined
  const max = filters.maxAmount.trim() ? parseMoney(filters.maxAmount, true) : undefined
  if (min !== undefined && max !== undefined && min > max)
    throw new Error('最低金额应小于或等于最高金额。')
}

export function filterEntries(
  entries: readonly LedgerEntry[],
  filters: LedgerFilters,
): LedgerEntry[] {
  validateFilters(filters)
  const min = filters.minAmount.trim() ? parseMoney(filters.minAmount, true) : 0
  const max = filters.maxAmount.trim()
    ? parseMoney(filters.maxAmount, true)
    : Number.MAX_SAFE_INTEGER
  return entries.filter(
    (entry) =>
      (!filters.startDate || entry.date >= filters.startDate) &&
      (!filters.endDate || entry.date <= filters.endDate) &&
      (!filters.category || entry.category === filters.category) &&
      entry.amountCents >= min &&
      entry.amountCents <= max,
  )
}

export function sortEntries(entries: readonly LedgerEntry[]): LedgerEntry[] {
  return [...entries].sort(
    (a, b) =>
      b.date.localeCompare(a.date) ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      b.id.localeCompare(a.id),
  )
}

export function dailyTotals(entries: readonly LedgerEntry[]) {
  const days = new Map<string, { date: string; income: number; expense: number }>()
  for (const entry of entries) {
    const day = days.get(entry.date) ?? { date: entry.date, income: 0, expense: 0 }
    day[entry.type] += entry.amountCents
    days.set(entry.date, day)
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function categoryTotals(entries: readonly LedgerEntry[]) {
  return categoryBreakdown(entries, 'expense').map(({ category, amount }) => ({ category, amount }))
}

export function categoryBreakdown(entries: readonly LedgerEntry[], type: EntryType) {
  const categories = new Map<string, { category: string; amount: number; count: number }>()
  for (const entry of entries) {
    if (entry.type !== type) continue
    const total = categories.get(entry.category) ?? {
      category: entry.category,
      amount: 0,
      count: 0,
    }
    total.amount += entry.amountCents
    total.count += 1
    categories.set(entry.category, total)
  }
  return [...categories.values()].sort((a, b) => b.amount - a.amount)
}

import { parseMoney } from '@/domain/ledger/money'
import type { LedgerEntry, LedgerFilters } from '@/domain/ledger/types'
import { convertCents, type CurrencyCode } from './currencies'

/**
 * 把账目投影到当前展示币种：金额按参考汇率换算，币种标识同步更换。
 * 只在展示层使用，写回 JSONL 时仍使用记录保存的原始币种和金额。
 */
export function projectEntries(
  entries: readonly LedgerEntry[],
  currency: CurrencyCode,
): LedgerEntry[] {
  return entries.map((entry) =>
    entry.currency === currency
      ? entry
      : {
          ...entry,
          currency,
          amountCents: convertCents(entry.amountCents, entry.currency, currency),
        },
  )
}

export function convertFilters(
  filters: LedgerFilters,
  from: CurrencyCode,
  to: CurrencyCode,
): LedgerFilters {
  const convert = (value: string) => {
    if (!value.trim()) return value
    const cents = convertCents(parseMoney(value, true), from, to)
    return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
  }
  return {
    ...filters,
    minAmount: convert(filters.minAmount),
    maxAmount: convert(filters.maxAmount),
  }
}

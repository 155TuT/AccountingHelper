import type { LedgerEntry } from '@/domain/ledger/types'
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

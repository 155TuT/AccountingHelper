import type { CurrencyCode } from '@/domain/currency/currencies'

export type EntryType = 'income' | 'expense'

export interface LedgerEntry {
  id: string
  type: EntryType
  date: string
  /** 记账币种的金额分，配合 `currency` 使用。 */
  amountCents: number
  category: string
  note: string
  createdAt: string
  /** 记账时的币种；旧账本缺少该字段时按人民币读取。 */
  currency: CurrencyCode
}

export interface EntryDraft {
  type: EntryType
  date: string
  amount: string
  category: string
  note: string
}

export interface LedgerFilters {
  startDate: string
  endDate: string
  category: string
  minAmount: string
  maxAmount: string
}

export interface LedgerTotals {
  income: number
  expense: number
  balance: number
}

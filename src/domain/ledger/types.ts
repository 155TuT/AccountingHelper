export type EntryType = 'income' | 'expense'

export interface LedgerEntry {
  id: string
  type: EntryType
  date: string
  amountCents: number
  category: string
  note: string
  createdAt: string
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

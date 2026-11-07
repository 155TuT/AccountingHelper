import type { EntryType, LedgerFilters } from './types'

export const CATEGORIES: Record<EntryType, readonly string[]> = {
  expense: ['饮食', '交通', '购物', '其他支出'],
  income: ['工资', '生活费', '其他收入'],
}

export const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income]

export const EMPTY_FILTERS: LedgerFilters = {
  startDate: '',
  endDate: '',
  category: '',
  minAmount: '',
  maxAmount: '',
}

export const PAGE_SIZE = 10

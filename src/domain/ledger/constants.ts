import type { LedgerFilters } from './types'

export const EMPTY_FILTERS: LedgerFilters = {
  startDate: '',
  endDate: '',
  categories: [],
  minAmount: '',
  maxAmount: '',
}

export const PAGE_SIZE = 10

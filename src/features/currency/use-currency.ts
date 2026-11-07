import { useState } from 'react'
import { DEFAULT_CURRENCY, type CurrencyCode } from '@/domain/currency/currencies'

export function useCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(DEFAULT_CURRENCY)

  return { currency, setCurrency }
}

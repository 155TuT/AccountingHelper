import { describe, expect, it } from 'vitest'
import type { LedgerEntry } from '@/domain/ledger/types'
import { formatCurrency } from '@/domain/ledger/money'
import {
  CURRENCIES,
  convertCents,
  currencyInfo,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  rateLabel,
  type CurrencyCode,
} from './currencies'
import { projectEntries } from './projection'

const cnyEntry: LedgerEntry = {
  id: 'cny-1',
  type: 'expense',
  date: '2026-11-07',
  amountCents: 2550,
  category: '饮食',
  note: '午餐',
  createdAt: '2026-11-07T12:00:00+08:00',
  currency: 'CNY',
}

const usdEntry: LedgerEntry = {
  ...cnyEntry,
  id: 'usd-1',
  amountCents: 1000,
  currency: 'USD',
  note: '咖啡',
}

describe('币种列表', () => {
  it('默认使用人民币，六种币种各有符号与参考汇率', () => {
    expect(DEFAULT_CURRENCY).toBe('CNY')
    expect(CURRENCIES.map((currency) => currency.code)).toEqual([
      'CNY',
      'USD',
      'EUR',
      'JPY',
      'HKD',
      'GBP',
    ])
    expect(currencyInfo('CNY').symbol).toBe('¥')
    expect(currencyInfo('JPY').symbol).toBe('JP¥')
    expect(() => currencyInfo('XXX' as CurrencyCode)).toThrow('不支持')
  })

  it('校验币种标识并给出汇率说明', () => {
    expect(isCurrencyCode('USD')).toBe(true)
    expect(isCurrencyCode('usd')).toBe(false)
    expect(isCurrencyCode(undefined)).toBe(false)
    expect(rateLabel('CNY')).toBe('基准币种')
    expect(rateLabel('USD')).toBe('1 USD ≈ ¥7.1')
    expect(rateLabel('JPY')).toBe('1 JPY ≈ ¥0.048')
  })

  it('按币种符号展示金额', () => {
    expect(formatCurrency(2550, 'CNY')).toBe('¥25.50')
    expect(formatCurrency(2550, 'USD')).toBe('$25.50')
    expect(formatCurrency(-2550, 'EUR')).toBe('-€25.50')
    expect(formatCurrency(2550)).toBe('¥25.50')
  })
})

describe('币种换算', () => {
  it('同币种保持不变，跨币种按参考汇率折算到分', () => {
    expect(convertCents(2550, 'CNY', 'CNY')).toBe(2550)
    expect(convertCents(1000, 'USD', 'CNY')).toBe(7100)
    expect(convertCents(7100, 'CNY', 'USD')).toBe(1000)
    expect(convertCents(1000, 'JPY', 'CNY')).toBe(48)
  })

  it('换算结果四舍五入到分，正负金额对称', () => {
    expect(convertCents(1, 'CNY', 'JPY')).toBe(21)
    expect(convertCents(25, 'CNY', 'JPY')).toBe(521)
    expect(convertCents(-1000, 'USD', 'CNY')).toBe(-7100)
  })

  it('拒绝非整数金额和超出精确计算范围的结果', () => {
    expect(() => convertCents(10.5, 'CNY', 'USD')).toThrow('精确计算')
    expect(() => convertCents(Number.MAX_SAFE_INTEGER, 'GBP', 'JPY')).toThrow('精确计算')
  })
})

describe('展示币种投影', () => {
  it('把混合币种的账目统一换算到展示币种，且不修改原账目', () => {
    const projected = projectEntries([cnyEntry, usdEntry], 'USD')
    expect(projected.map((entry) => entry.currency)).toEqual(['USD', 'USD'])
    expect(projected.map((entry) => entry.amountCents)).toEqual([359, 1000])
    expect(projected.map((entry) => entry.id)).toEqual(['cny-1', 'usd-1'])
    expect(cnyEntry.amountCents).toBe(2550)
    expect(cnyEntry.currency).toBe('CNY')
  })

  it('展示币种与账目一致时直接复用原对象', () => {
    const [entry] = projectEntries([cnyEntry], 'CNY')
    expect(entry).toBe(cnyEntry)
  })
})

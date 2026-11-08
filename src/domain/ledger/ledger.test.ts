import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS } from './constants'
import { formatMoney, parseMoney } from './money'
import {
  categoryBreakdown,
  categoryTotals,
  countActiveFilters,
  dailyTotals,
  filterEntries,
  sortEntries,
  summarize,
  validateFilters,
} from './selectors'
import type { LedgerEntry, LedgerFilters } from './types'
import { isValidDate, validateEntry } from './validation'

const entries: LedgerEntry[] = [
  {
    id: '1',
    type: 'expense',
    date: '2026-11-06',
    amountCents: 2550,
    category: '饮食',
    note: '午餐',
    createdAt: '2026-11-06T12:00:00+08:00',
    currency: 'CNY',
  },
  {
    id: '2',
    type: 'expense',
    date: '2026-11-07',
    amountCents: 200,
    category: '交通',
    note: '',
    createdAt: '2026-11-07T08:00:00+08:00',
    currency: 'CNY',
  },
  {
    id: '3',
    type: 'income',
    date: '2026-11-07',
    amountCents: 10000,
    category: '工资',
    note: '',
    createdAt: '2026-11-07T01:00:00Z',
    currency: 'CNY',
  },
]

describe('金额与日期', () => {
  it('用整数精确转换小数，拒绝隐式四舍五入与非法输入', () => {
    expect(parseMoney('0.10') + parseMoney('0.20')).toBe(30)
    expect(formatMoney(100001)).toBe('1,000.01')
    expect(parseMoney('01.2')).toBe(120)
    for (const input of ['', '0', '-1', '1.234', '1e3', '90071992547410'])
      expect(() => parseMoney(input)).toThrow()
    expect(parseMoney('0', true)).toBe(0)
  })
  it('校验真实日历日期', () => {
    expect(isValidDate('2024-02-29')).toBe(true)
    expect(isValidDate('2026-02-29')).toBe(false)
    expect(isValidDate('2026-13-01')).toBe(false)
  })
  it('读取账本时接受本地自定义类别，拒绝空类别', () => {
    expect(validateEntry({ ...entries[0], category: '咖啡' }).category).toBe('咖啡')
    expect(() => validateEntry({ ...entries[0], category: ' ' })).toThrow('类别')
  })
})

describe('账目筛选和统计', () => {
  it('满足 PRD 的三笔账目验收口径', () => {
    expect(summarize(entries)).toEqual({ income: 10000, expense: 2750, balance: 7250 })
    expect(
      summarize(
        filterEntries(entries, {
          ...EMPTY_FILTERS,
          categories: [{ type: 'expense', category: '饮食' }],
        }),
      ),
    ).toEqual({
      income: 0,
      expense: 2550,
      balance: -2550,
    })
    expect(summarize([])).toEqual({ income: 0, expense: 0, balance: 0 })
  })
  it('组合条件取交集，日期与金额边界均计入', () => {
    const filters: LedgerFilters = {
      ...EMPTY_FILTERS,
      startDate: '2026-11-06',
      endDate: '2026-11-06',
      minAmount: '25.50',
      maxAmount: '25.50',
      categories: [{ type: 'expense', category: '饮食' }],
    }
    expect(filterEntries(entries, filters).map((item) => item.id)).toEqual(['1'])
    expect(
      filterEntries(entries, { ...filters, categories: [{ type: 'expense', category: '交通' }] }),
    ).toEqual([])
    expect(
      filterEntries(entries, {
        ...EMPTY_FILTERS,
        categories: [{ type: 'expense', category: '自定义类别' }],
      }),
    ).toEqual([])
    expect(() =>
      validateFilters({ ...EMPTY_FILTERS, startDate: '2026-11-07', endDate: '2026-11-06' }),
    ).toThrow()
    expect(() => validateFilters({ ...EMPTY_FILTERS, minAmount: '2', maxAmount: '1' })).toThrow()
  })
  it('同日记录按真实录入时刻倒序，兼容不同时区', () => {
    expect(sortEntries(entries).map((item) => item.id)).toEqual(['3', '2', '1'])
    expect(entries[0]?.id).toBe('1')
  })
  it('多选类别取并集，再与日期及金额条件取交集', () => {
    const filters: LedgerFilters = {
      ...EMPTY_FILTERS,
      categories: [
        { type: 'expense', category: '饮食' },
        { type: 'income', category: '工资' },
      ],
    }
    expect(filterEntries(entries, filters).map((entry) => entry.id)).toEqual(['1', '3'])
    expect(
      filterEntries(entries, { ...filters, startDate: '2026-11-07' }).map((entry) => entry.id),
    ).toEqual(['3'])
    expect(
      filterEntries(entries, { ...filters, maxAmount: '25.50' }).map((entry) => entry.id),
    ).toEqual(['1'])
    expect(filterEntries(entries, { ...filters, categories: [] })).toEqual(entries)
  })
  it('历史收入和支出的同名类别可分别选择', () => {
    const records: LedgerEntry[] = [
      { ...entries[0]!, category: '其他' },
      { ...entries[2]!, category: '其他' },
    ]
    expect(
      filterEntries(records, {
        ...EMPTY_FILTERS,
        categories: [{ type: 'income', category: '其他' }],
      }).map((entry) => entry.id),
    ).toEqual(['3'])
    expect(
      filterEntries(records, {
        ...EMPTY_FILTERS,
        categories: [{ type: 'expense', category: '其他' }],
      }).map((entry) => entry.id),
    ).toEqual(['1'])
  })
  it('空类别数组不触发筛选状态，多选类别计作一个条件', () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0)
    expect(
      countActiveFilters({
        ...EMPTY_FILTERS,
        minAmount: '0',
        categories: [
          { type: 'expense', category: '饮食' },
          { type: 'income', category: '工资' },
        ],
      }),
    ).toBe(2)
  })
  it('图表与汇总共用相同账目口径', () => {
    const days = dailyTotals(entries)
    expect(days.reduce((sum, day) => sum + day.expense, 0)).toBe(2750)
    expect(categoryTotals(entries).reduce((sum, category) => sum + category.amount, 0)).toBe(2750)
    expect(categoryBreakdown(entries, 'expense')).toEqual([
      { category: '饮食', amount: 2550, count: 1 },
      { category: '交通', amount: 200, count: 1 },
    ])
    expect(() =>
      summarize([{ ...entries[0]!, amountCents: Number.MAX_SAFE_INTEGER }, entries[1]!]),
    ).toThrow()
  })
  it('对筛选后的收入按类别累计金额和笔数', () => {
    const income = entries[2]!
    const records = [
      ...entries,
      { ...income, id: '4', amountCents: 3000 },
      { ...income, id: '5', amountCents: 9000, category: '生活费' },
      { ...income, id: '6', amountCents: 400, date: '2026-11-06' },
    ]
    const filtered = filterEntries(records, { ...EMPTY_FILTERS, startDate: '2026-11-07' })
    const categories = categoryBreakdown(filtered, 'income')
    expect(categories).toEqual([
      { category: '工资', amount: 13000, count: 2 },
      { category: '生活费', amount: 9000, count: 1 },
    ])
    expect(categories.reduce((sum, { amount }) => sum + amount, 0)).toBe(summarize(filtered).income)
    expect(
      categoryBreakdown(
        filterEntries(records, {
          ...EMPTY_FILTERS,
          categories: [{ type: 'expense', category: '饮食' }],
        }),
        'income',
      ),
    ).toEqual([])
  })
})
